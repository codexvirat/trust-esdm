"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  assignTrainerAction,
  removeTrainerAssignmentAction,
  assignWorkshopManagerAction,
  removeWorkshopManagerAssignmentAction,
  setBatchStatusAction,
  updateBatchVenueAction,
  deleteBatchAction,
  type FormState,
} from "@/app/actions/workshops";
import { StatusPill } from "@/components/StatusPill";
import type { Batch, TrainerAssignment, WorkshopManagerAssignment, UserSummary, Venue } from "@/lib/types";

const initialState: FormState = {};

const NEXT_BATCH_STATUS: Record<Batch["status"], { label: string; status: Batch["status"] }[]> = {
  scheduled: [{ label: "Mark ongoing", status: "ongoing" }, { label: "Cancel", status: "cancelled" }],
  ongoing: [
    { label: "Mark completed", status: "completed" },
    { label: "Revert to upcoming", status: "scheduled" },
    { label: "Cancel", status: "cancelled" },
  ],
  completed: [{ label: "Reopen (mark ongoing)", status: "ongoing" }],
  cancelled: [{ label: "Reactivate (mark upcoming)", status: "scheduled" }],
};

export function BatchItem({
  workshopId,
  batch,
  assignments,
  trainers,
  workshopManagerAssignments,
  workshopManagers,
  venues,
}: {
  workshopId: string;
  batch: Batch;
  assignments: TrainerAssignment[];
  trainers: UserSummary[];
  workshopManagerAssignments: WorkshopManagerAssignment[];
  workshopManagers: UserSummary[];
  venues: Venue[];
}) {
  const [showAssign, setShowAssign] = useState(false);
  const boundAssign = assignTrainerAction.bind(null, workshopId, batch._id);
  const [state, action, pending] = useActionState(boundAssign, initialState);
  const [removePending, startRemove] = useTransition();
  const [statusPending, startStatusChange] = useTransition();
  const [venuePending, startVenueChange] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const [showAssignWorkshopManager, setShowAssignWorkshopManager] = useState(false);
  const boundAssignWorkshopManager = assignWorkshopManagerAction.bind(null, workshopId, batch._id);
  const [wmState, wmAction, wmPending] = useActionState(boundAssignWorkshopManager, initialState);
  const [removeWmPending, startRemoveWm] = useTransition();

  const nextStatusActions = NEXT_BATCH_STATUS[batch.status];

  const trainerById = new Map(trainers.map((t) => [t._id, t]));
  const assignedTrainerIds = new Set(assignments.map((a) => a.trainerId));
  const availableTrainers = trainers.filter((t) => !assignedTrainerIds.has(t._id));

  const workshopManagerById = new Map(workshopManagers.map((w) => [w._id, w]));
  const assignedWorkshopManagerIds = new Set(workshopManagerAssignments.map((a) => a.workshopManagerId));
  const availableWorkshopManagers = workshopManagers.filter((w) => !assignedWorkshopManagerIds.has(w._id));

  return (
    <li className="py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {batch.name} <span className="text-slate-400">({batch.code})</span>
          </p>
          <p className="text-xs text-slate-500">
            {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()} · {batch.enrolledCount}
            {batch.capacity ? ` / ${batch.capacity}` : ""} enrolled
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href={`/dashboard/workshops/${workshopId}/batches/${batch._id}`} className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline">
            Attendance, photos &amp; candidates →
          </Link>
          <StatusPill status={batch.status} />
          <button
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (window.confirm(`Delete batch "${batch.name}"? This also removes its enrollments, attendance, and certificates.`)) {
                startDelete(() => deleteBatchAction(workshopId, batch._id));
              }
            }}
            className="text-xs font-medium text-red-700 hover:underline disabled:opacity-60"
          >
            {deletePending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-slate-500">Venue</label>
        <select
          defaultValue={batch.venueId ?? ""}
          disabled={venuePending}
          onChange={(e) => startVenueChange(() => updateBatchVenueAction(workshopId, batch._id, e.target.value))}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-60"
        >
          <option value="">No venue</option>
          {venues.map((venue) => (
            <option key={venue._id} value={venue._id}>
              {venue.name}
              {venue.city ? ` — ${venue.city}` : ""}
            </option>
          ))}
        </select>
      </div>

      {nextStatusActions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {nextStatusActions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={statusPending}
              onClick={() => startStatusChange(() => setBatchStatusAction(workshopId, batch._id, action.status))}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition disabled:opacity-60 ${
                action.status === "cancelled" ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {assignments.map((a) => {
          const trainer = trainerById.get(a.trainerId);
          return (
            <span key={a._id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs text-slate-700">
              {trainer?.fullName ?? "Unknown trainer"}
              {a.roleInBatch === "lead" && <span className="text-slate-400">(lead)</span>}
              <button
                type="button"
                disabled={removePending}
                onClick={() => startRemove(() => removeTrainerAssignmentAction(workshopId, batch._id, a._id))}
                className="rounded-full px-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label={`Remove ${trainer?.fullName ?? "trainer"}`}
              >
                ×
              </button>
            </span>
          );
        })}

        {!showAssign && (
          <button type="button" onClick={() => setShowAssign(true)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
            + Assign trainer
          </button>
        )}
      </div>

      {showAssign && (
        <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
          <select name="trainerId" required className="rounded-md border border-slate-300 px-2 py-1 text-xs">
            <option value="">Choose a trainer…</option>
            {availableTrainers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.fullName} ({t.email})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending || availableTrainers.length === 0}
            className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Assigning…" : "Assign"}
          </button>
          <button type="button" onClick={() => setShowAssign(false)} className="text-xs text-slate-500 hover:text-slate-800">
            Cancel
          </button>
          {state.error && <p className="w-full text-xs text-red-700">{state.error}</p>}
          {availableTrainers.length === 0 && <p className="w-full text-xs text-amber-700">Every trainer in the project is already assigned to this batch.</p>}
        </form>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {workshopManagerAssignments.map((a) => {
          const workshopManager = workshopManagerById.get(a.workshopManagerId);
          return (
            <span key={a._id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs text-slate-700">
              {workshopManager?.fullName ?? "Unknown workshop manager"}
              <button
                type="button"
                disabled={removeWmPending}
                onClick={() => startRemoveWm(() => removeWorkshopManagerAssignmentAction(workshopId, batch._id, a._id))}
                className="rounded-full px-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label={`Remove ${workshopManager?.fullName ?? "workshop manager"}`}
              >
                ×
              </button>
            </span>
          );
        })}

        {!showAssignWorkshopManager && (
          <button
            type="button"
            onClick={() => setShowAssignWorkshopManager(true)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            + Assign workshop manager
          </button>
        )}
      </div>

      {showAssignWorkshopManager && (
        <form action={wmAction} className="mt-2 flex flex-wrap items-center gap-2">
          <select name="workshopManagerId" required className="rounded-md border border-slate-300 px-2 py-1 text-xs">
            <option value="">Choose a workshop manager…</option>
            {availableWorkshopManagers.map((w) => (
              <option key={w._id} value={w._id}>
                {w.fullName} ({w.email})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={wmPending || availableWorkshopManagers.length === 0}
            className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {wmPending ? "Assigning…" : "Assign"}
          </button>
          <button type="button" onClick={() => setShowAssignWorkshopManager(false)} className="text-xs text-slate-500 hover:text-slate-800">
            Cancel
          </button>
          {wmState.error && <p className="w-full text-xs text-red-700">{wmState.error}</p>}
          {availableWorkshopManagers.length === 0 && (
            <p className="w-full text-xs text-amber-700">Every workshop manager in the project is already assigned to this batch.</p>
          )}
        </form>
      )}
    </li>
  );
}
