"use client";

import { useState, useTransition } from "react";
import { assignFeedbackFormToBatchAction, setFeedbackEnabledAction } from "@/app/actions/feedback";
import type { FeedbackForm } from "@/lib/types";

export function FeedbackAssignPanel({
  projectId,
  workshopId,
  batchId,
  forms,
}: {
  projectId: string;
  workshopId: string;
  batchId: string;
  forms: FeedbackForm[];
}) {
  const current = forms.find((f) => f.batchId === batchId);
  const isOn = Boolean(current?.isEnabled);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedId, setSelectedId] = useState(current?._id ?? "");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [togglePending, startToggle] = useTransition();

  const available = forms.filter((f) => !f.batchId || f.batchId === batchId);

  function turnOff() {
    if (!current) return;
    startToggle(() => setFeedbackEnabledAction(projectId, workshopId, current._id, false));
  }

  function assign() {
    if (!selectedId) {
      setError("Choose a feedback form.");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await assignFeedbackFormToBatchAction(projectId, workshopId, selectedId, batchId);
      if (result.error) setError(result.error);
      else setShowPicker(false);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Feedback</h2>
          <p className="mt-1 text-xs text-slate-500">
            {isOn && current ? `Assigned: ${current.title || "Feedback form"}` : "This batch has no feedback form yet."}
          </p>
        </div>
        <button
          type="button"
          disabled={togglePending}
          onClick={() => {
            if (isOn) turnOff();
            else setShowPicker(true);
          }}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-60 ${
            isOn ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {togglePending ? "Updating…" : isOn ? "On — click to turn off" : "Off — click to turn on"}
        </button>
      </div>

      {isOn && current && (
        <button type="button" onClick={() => { setSelectedId(current._id); setShowPicker(true); }} className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-800">
          Change assigned feedback form
        </button>
      )}

      {showPicker && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {available.length === 0 ? (
            <p className="text-xs text-amber-700">No feedback forms available for this workshop yet — create one in the Feedback tab first.</p>
          ) : (
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Choose a feedback form…</option>
              {available.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.title || "Feedback form"} {f.batchId === batchId ? "(currently assigned)" : ""}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            disabled={pending || available.length === 0}
            onClick={assign}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Assigning…" : "Assign"}
          </button>
          <button type="button" onClick={() => setShowPicker(false)} className="text-xs text-slate-500 hover:text-slate-800">
            Cancel
          </button>
          {error && <p className="w-full text-xs text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
