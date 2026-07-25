"use client";

import { useRouter } from "next/navigation";
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

export function BatchManagePanel({
  projectId,
  workshopId,
  batch,
  assignments,
  trainers,
  workshopManagerAssignments,
  workshopManagers,
  venues,
}: {
  projectId: string;
  workshopId: string;
  batch: Batch;
  assignments: TrainerAssignment[];
  trainers: UserSummary[];
  workshopManagerAssignments: WorkshopManagerAssignment[];
  workshopManagers: UserSummary[];
  venues: Venue[];
}) {
  const router = useRouter();

  const [showAssign, setShowAssign] = useState(false);
  const boundAssign = assignTrainerAction.bind(null, projectId, workshopId, batch._id);
  const [state, action, pending] = useActionState(boundAssign, initialState);
  const [removePending, startRemove] = useTransition();
  const [statusPending, startStatusChange] = useTransition();
  const [venuePending, startVenueChange] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const [showAssignWorkshopManager, setShowAssignWorkshopManager] = useState(false);
  const boundAssignWorkshopManager = assignWorkshopManagerAction.bind(null, projectId, workshopId, batch._id);
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
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Status &amp; venue</h2>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Venue</label>
          <select
            defaultValue={batch.venueId ?? ""}
            disabled={venuePending}
            onChange={(e) => startVenueChange(() => updateBatchVenueAction(projectId, workshopId, batch._id, e.target.value))}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-60"
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {nextStatusActions.map((action) => (
              <button
                key={action.status}
                type="button"
                disabled={statusPending}
                onClick={() => startStatusChange(() => setBatchStatusAction(projectId, workshopId, batch._id, action.status))}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                  action.status === "cancelled" ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Trainers</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {assignments.map((a) => {
            const trainer = trainerById.get(a.trainerId);
            return (
              <span key={a._id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs text-slate-700">
                {trainer?.fullName ?? "Unknown trainer"}
                {a.roleInBatch === "lead" && <span className="text-slate-400">(lead)</span>}
                <button
                  type="button"
                  disabled={removePending}
                  onClick={() => startRemove(() => removeTrainerAssignmentAction(projectId, workshopId, batch._id, a._id))}
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
          <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
            <select name="trainerId" required className="rounded-md border border-slate-300 px-2 py-1 text-sm">
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
              className="rounded-md bg-slate-900 px-2.5 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pending ? "Assigning…" : "Assign"}
            </button>
            <button type="button" onClick={() => setShowAssign(false)} className="text-sm text-slate-500 hover:text-slate-800">
              Cancel
            </button>
            {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
            {availableTrainers.length === 0 && (
              <p className="w-full text-sm text-amber-700">Every trainer in the project is already assigned to this batch.</p>
            )}
          </form>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Workshop managers</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {workshopManagerAssignments.map((a) => {
            const workshopManager = workshopManagerById.get(a.workshopManagerId);
            return (
              <span key={a._id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs text-slate-700">
                {workshopManager?.fullName ?? "Unknown workshop manager"}
                <button
                  type="button"
                  disabled={removeWmPending}
                  onClick={() => startRemoveWm(() => removeWorkshopManagerAssignmentAction(projectId, workshopId, batch._id, a._id))}
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
          <form action={wmAction} className="mt-3 flex flex-wrap items-center gap-2">
            <select name="workshopManagerId" required className="rounded-md border border-slate-300 px-2 py-1 text-sm">
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
              className="rounded-md bg-slate-900 px-2.5 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {wmPending ? "Assigning…" : "Assign"}
            </button>
            <button type="button" onClick={() => setShowAssignWorkshopManager(false)} className="text-sm text-slate-500 hover:text-slate-800">
              Cancel
            </button>
            {wmState.error && <p className="w-full text-sm text-red-700">{wmState.error}</p>}
            {availableWorkshopManagers.length === 0 && (
              <p className="w-full text-sm text-amber-700">Every workshop manager in the project is already assigned to this batch.</p>
            )}
          </form>
        )}
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-base font-semibold text-red-900">Danger zone</h2>
        <p className="mt-1 text-sm text-red-700">Deleting a batch also removes its enrollments, attendance, and certificates.</p>
        <div className="mt-4">
          <button
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (window.confirm(`Delete batch "${batch.name}"? This also removes its enrollments, attendance, and certificates.`)) {
                startDelete(async () => {
                  await deleteBatchAction(projectId, workshopId, batch._id);
                  router.push(`/dashboard/workshops/${workshopId}?projectId=${projectId}`);
                });
              }
            }}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {deletePending ? "Deleting…" : "Delete batch"}
          </button>
        </div>
      </div>
    </div>
  );
}
