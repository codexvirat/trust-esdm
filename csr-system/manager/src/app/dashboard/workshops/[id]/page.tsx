import { notFound } from "next/navigation";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { WorkshopSummary, Batch, TrainerAssignment, WorkshopManagerAssignment, UserSummary, Venue } from "@/lib/types";
import { setWorkshopStatusAction } from "@/app/actions/workshops";
import { CreateBatchForm } from "./CreateBatchForm";
import { EditWorkshopForm } from "./EditWorkshopForm";
import { BatchItem } from "./BatchItem";

const NEXT_STATUS: Record<string, { label: string; status: WorkshopSummary["status"] }[]> = {
  draft: [{ label: "Publish", status: "published" }],
  published: [
    { label: "Mark ongoing", status: "ongoing" },
    { label: "Revert to draft", status: "draft" },
    { label: "Cancel", status: "cancelled" },
  ],
  ongoing: [
    { label: "Mark completed", status: "completed" },
    { label: "Revert to published", status: "published" },
    { label: "Cancel", status: "cancelled" },
  ],
  completed: [{ label: "Reopen (mark ongoing)", status: "ongoing" }],
  cancelled: [{ label: "Reactivate (mark published)", status: "published" }],
};

export default async function WorkshopOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessToken } = await requireManagerRole();

  let workshop: WorkshopSummary;
  let batches: Batch[];
  let trainers: UserSummary[];
  let workshopManagers: UserSummary[];
  let venues: Venue[];
  try {
    [workshop, batches, trainers, workshopManagers, venues] = await Promise.all([
      apiFetch<WorkshopSummary>(`/workshops/${id}`, { accessToken }),
      apiFetch<Batch[]>(`/workshops/${id}/batches`, { accessToken }),
      apiFetch<UserSummary[]>("/users?roleCode=trainer", { accessToken }),
      apiFetch<UserSummary[]>("/users?roleCode=workshop_manager", { accessToken }),
      apiFetch<Venue[]>("/venues", { accessToken }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const assignmentsByBatch = new Map(
    await Promise.all(
      batches.map(
        async (batch) => [batch._id, await apiFetch<TrainerAssignment[]>(`/workshops/${id}/batches/${batch._id}/trainer-assignments`, { accessToken })] as const,
      ),
    ),
  );

  const workshopManagerAssignmentsByBatch = new Map(
    await Promise.all(
      batches.map(
        async (batch) =>
          [
            batch._id,
            await apiFetch<WorkshopManagerAssignment[]>(`/workshops/${id}/batches/${batch._id}/workshop-manager-assignments`, { accessToken }),
          ] as const,
      ),
    ),
  );

  const nextActions = NEXT_STATUS[workshop.status] ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-4">
        <Info label="Type" value={workshop.type} />
        <Info label="Mode" value={workshop.mode} />
        <Info label="Enrolled" value={`${workshop.enrolledCount}${workshop.capacity ? ` / ${workshop.capacity}` : ""}`} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {nextActions.map((action) => (
          <form key={action.status} action={setWorkshopStatusAction.bind(null, workshop._id, action.status)}>
            <button
              type="submit"
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                action.status === "cancelled" ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {action.label}
            </button>
          </form>
        ))}
        <EditWorkshopForm workshop={workshop} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Batches</h2>
          <CreateBatchForm workshopId={workshop._id} venues={venues} />
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {batches.map((batch) => (
            <BatchItem
              key={batch._id}
              workshopId={workshop._id}
              batch={batch}
              assignments={assignmentsByBatch.get(batch._id) ?? []}
              trainers={trainers}
              workshopManagerAssignments={workshopManagerAssignmentsByBatch.get(batch._id) ?? []}
              workshopManagers={workshopManagers}
              venues={venues}
            />
          ))}
          {batches.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No batches yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-slate-900">{value}</p>
    </div>
  );
}
