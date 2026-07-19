"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export function CameraScanner({ onScan }: { onScan: (token: string) => void }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stop = useCallback(() => {
    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          if (code?.data) {
            onScanRef.current(code.data);
            stop();
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't access the camera — check browser permissions, or use a badge scanner / paste the code instead.");
          setActive(false);
        }
      });

    return () => {
      cancelled = true;
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active, stop]);

  if (!active) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => {
            setError(undefined);
            setActive(true);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          📷 Scan with camera
        </button>
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full max-w-xs overflow-hidden rounded-md border border-slate-300 bg-black">
        <video ref={videoRef} muted playsInline className="w-full" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="pointer-workshops-none absolute inset-8 rounded-md border-2 border-emerald-400/80" />
      </div>
      <button type="button" onClick={stop} className="self-start text-xs text-slate-500 hover:text-slate-800">
        Cancel
      </button>
    </div>
  );
}
