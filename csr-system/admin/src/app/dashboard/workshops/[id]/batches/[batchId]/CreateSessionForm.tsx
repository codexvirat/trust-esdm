"use client";

import { useActionState, useState } from "react";
import { generateAttendanceSessionAction, type FormState } from "@/app/actions/attendance";

const initialState: FormState = {};

export function CreateSessionForm({ projectId, workshopId, batchId }: { projectId: string; workshopId: string; batchId: string }) {
  const [open, setOpen] = useState(false);
  const bound = generateAttendanceSessionAction.bind(null, projectId, workshopId, batchId);
  const [state, action, pending] = useActionState(bound, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
        + Open session
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Date</label>
        <input name="sessionDate" type="date" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Label</label>
        <input name="sessionLabel" placeholder="Day 1 — Morning" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Opening…" : "Open session"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
        Cancel
      </button>
    </form>
  );
}
