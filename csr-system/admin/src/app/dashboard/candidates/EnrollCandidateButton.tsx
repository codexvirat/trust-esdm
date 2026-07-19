"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { enrollCandidateAction, type FormState } from "@/app/actions/candidates";
import type { Batch, WorkshopSummary } from "@/lib/types";

const initialState: FormState = {};

export function EnrollCandidateButton({
  projectId,
  candidateId,
  workshops,
  batchesByWorkshop,
}: {
  projectId: string;
  candidateId: string;
  workshops: WorkshopSummary[];
  batchesByWorkshop: Record<string, Batch[]>;
}) {
  const [open, setOpen] = useState(false);
  const [workshopId, setWorkshopId] = useState("");
  const bound = enrollCandidateAction.bind(null, projectId);
  const [state, action, pending] = useActionState(bound, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
      setWorkshopId("");
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const batches = useMemo(() => (workshopId ? (batchesByWorkshop[workshopId] ?? []) : []), [workshopId, batchesByWorkshop]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-teal-700 hover:text-teal-900">
        Enroll
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="candidateUserId" value={candidateId} />
      <select
        name="workshopId"
        required
        value={workshopId}
        onChange={(e) => setWorkshopId(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
      >
        <option value="">Workshop…</option>
        {workshops.map((e) => (
          <option key={e._id} value={e._id}>
            {e.title}
          </option>
        ))}
      </select>
      <select name="batchId" required disabled={!workshopId} className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:bg-slate-50">
        <option value="">{workshopId ? "Batch…" : "Pick workshop first"}</option>
        {batches.map((b) => (
          <option key={b._id} value={b._id}>
            {b.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Enrolling…" : "Confirm"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-700">
        Cancel
      </button>
      {state.error && <p role="alert" className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
