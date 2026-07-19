"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateWorkshopAction, type FormState } from "@/app/actions/workshops";
import type { WorkshopSummary } from "@/lib/types";

const initialState: FormState = {};

export function EditWorkshopForm({ workshop }: { workshop: WorkshopSummary }) {
  const [open, setOpen] = useState(false);
  const boundAction = updateWorkshopAction.bind(null, workshop._id);
  const [state, action, pending] = useActionState(boundAction, initialState);

  // useActionState's dispatcher can't be awaited for a return value the way a
  // normal async function can — it just triggers a state transition. Closing
  // the form on success means watching that transition instead.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
        Edit
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Edit workshop</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Cancel
        </button>
      </div>

      <form action={action} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="edit-title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="edit-title"
            name="title"
            defaultValue={workshop.title}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="edit-description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="edit-description"
            name="description"
            defaultValue={workshop.description}
            required
            rows={3}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="edit-type" className="text-sm font-medium text-slate-700">
            Type
          </label>
          <select
            id="edit-type"
            name="type"
            defaultValue={workshop.type}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >
            {["workshop", "bootcamp", "seminar", "csr_drive", "webinar", "other"].map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="edit-mode" className="text-sm font-medium text-slate-700">
            Mode
          </label>
          <select
            id="edit-mode"
            name="mode"
            defaultValue={workshop.mode}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >
            {["offline", "online", "hybrid"].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="edit-capacity" className="text-sm font-medium text-slate-700">
            Capacity
          </label>
          <input
            id="edit-capacity"
            name="capacity"
            type="number"
            defaultValue={workshop.capacity ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
