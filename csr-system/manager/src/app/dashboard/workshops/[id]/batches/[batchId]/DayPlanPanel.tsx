"use client";

import { useActionState, useTransition } from "react";
import { addDayPlanEntryAction, removeDayPlanEntryAction, type FormState } from "@/app/actions/workshops";
import type { DayPlanEntry, UserSummary } from "@/lib/types";

const initialState: FormState = {};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Admin (Super)",
  admin: "Org Admin",
  manager: "Manager",
  workshop_manager: "Workshop Manager",
};

export function DayPlanPanel({
  workshopId,
  batchId,
  entries,
  staff,
}: {
  workshopId: string;
  batchId: string;
  entries: DayPlanEntry[];
  staff: UserSummary[];
}) {
  const boundAction = addDayPlanEntryAction.bind(null, workshopId, batchId);
  const [state, action, pending] = useActionState(boundAction, initialState);
  const [removePending, startRemove] = useTransition();

  const staffById = new Map(staff.map((s) => [s._id, s]));
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">Day-wise plan</h2>
      <p className="mt-1 text-sm text-slate-500">What runs on which date, and who&apos;s responsible for it.</p>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">Date</label>
          <input name="date" type="date" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">Title</label>
          <input name="title" required placeholder="e.g. Orientation" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">Assign to</label>
          <select name="assignedToUserId" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName} ({ROLE_LABELS[s.roleCode] ?? s.roleCode})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add"}
        </button>
        {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <ul className="divide-y divide-slate-100">
          {sortedEntries.map((entry) => {
            const assignee = entry.assignedToUserId ? staffById.get(entry.assignedToUserId) : null;
            return (
              <li key={entry._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(entry.date).toLocaleDateString()} — {entry.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {assignee ? `${assignee.fullName} (${ROLE_LABELS[assignee.roleCode] ?? assignee.roleCode})` : "Unassigned"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={removePending}
                  onClick={() => startRemove(() => removeDayPlanEntryAction(workshopId, batchId, entry._id))}
                  className="text-xs font-medium text-red-700 hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            );
          })}
          {sortedEntries.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">No day-plan entries yet.</li>}
        </ul>
      </div>
    </div>
  );
}
