"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import QRCode from "qrcode";
import { regenerateBadgeAction } from "@/app/actions/attendance";

export function QrDisplay({ token }: { token: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, token, { width: 240, margin: 2 }, (err) => {
      if (err) setError("Failed to render QR code.");
    });
  }, [token]);

  function regenerate() {
    setError(undefined);
    startTransition(async () => {
      const result = await regenerateBadgeAction();
      if (result.error) setError(result.error);
      setConfirming(false);
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6">
      <canvas ref={canvasRef} className="rounded-lg border border-slate-100" />
      <p className="text-center text-xs text-slate-500">
        Show this code to your trainer at check-in. They&apos;ll scan it to mark your attendance.
      </p>

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

      {confirming ? (
        <div className="flex flex-col items-center gap-2 rounded-md bg-amber-50 p-3 text-center">
          <p className="text-xs text-amber-800">
            This invalidates your current badge. Anyone with a copy of it will no longer be able to use it.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={regenerate}
              className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {pending ? "Regenerating…" : "Yes, regenerate"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs font-medium text-teal-700 hover:text-teal-900"
        >
          Regenerate badge
        </button>
      )}
    </div>
  );
}
