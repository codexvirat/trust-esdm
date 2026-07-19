"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { scanCandidateBadgeAction, type FormState } from "@/app/actions/attendance";
import { CameraScanner } from "./CameraScanner";

const initialState: FormState = {};

export function ScanBadgeForm({ workshopId, batchId, sessionId }: { workshopId: string; batchId: string; sessionId: string }) {
  const bound = scanCandidateBadgeAction.bind(null, workshopId, batchId, sessionId);
  const [state, action, pending] = useActionState(bound, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);
  const [, startTransition] = useTransition();

  // Clear + refocus after every scan (success or failure) so staff can keep
  // scanning candidates back-to-back without touching the mouse.
  useEffect(() => {
    if (wasPending.current && !pending) {
      if (inputRef.current) inputRef.current.value = "";
      inputRef.current?.focus();
    }
    wasPending.current = pending;
  }, [pending]);

  function submitToken(token: string) {
    if (inputRef.current) inputRef.current.value = token;
    const formData = new FormData();
    formData.set("candidateQrToken", token);
    // The camera scanner calls this from a requestAnimationFrame callback, not
    // a real form-submit workshop, so React doesn't automatically treat it as a
    // transition the way it does for <form action={action}> — has to be explicit.
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`scan-${sessionId}`} className="text-xs font-medium text-slate-600">
          Scan candidate badge
        </label>
        <form action={action} className="flex flex-1 flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={`scan-${sessionId}`}
            name="candidateQrToken"
            autoComplete="off"
            placeholder="Use a badge scanner, or scan/paste below"
            className="min-w-56 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm font-mono"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Marking…" : "Mark present"}
          </button>
        </form>
      </div>

      <CameraScanner onScan={submitToken} />

      {state.error && <p className="text-xs text-red-700">{state.error}</p>}
    </div>
  );
}
