"use client";

import { useActionState, useState } from "react";
import { createBatchAction, type FormState } from "@/app/actions/workshops";
import type { Venue } from "@/lib/types";

const initialState: FormState = {};

export function CreateBatchForm({ projectId, workshopId, venues }: { projectId: string; workshopId: string; venues: Venue[] }) {
  const [open, setOpen] = useState(false);
  const boundAction = createBatchAction.bind(null, projectId, workshopId);
  const [state, action, pending] = useActionState(boundAction, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-slate-600 hover:text-slate-900">
        + Add batch
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Code</label>
        <input name="code" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-xs font-medium text-slate-600">Name</label>
        <input name="name" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Start</label>
        <input name="startDate" type="date" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">End</label>
        <input name="endDate" type="date" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Venue</label>
        <select name="venueId" defaultValue="" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">No venue</option>
          {venues.map((venue) => (
            <option key={venue._id} value={venue._id}>
              {venue.name}
              {venue.city ? ` — ${venue.city}` : ""}
            </option>
          ))}
        </select>
      </div>
      {state.error && <p className="col-span-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add batch"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
          Cancel
        </button>
      </div>
    </form>
  );
}
