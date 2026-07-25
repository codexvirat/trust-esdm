import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Batch, TrainerAssignment, WorkshopManagerAssignment, UserSummary, Venue } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { BatchTabs } from "../BatchTabs";
import { BatchManagePanel } from "../BatchManagePanel";

export default async function BatchManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; batchId: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { id: workshopId, batchId } = await params;
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;
  const orgQuery = `projectId=${projectId}`;

  let batch: Batch;
  let assignments: TrainerAssignment[];
  let trainers: UserSummary[];
  let workshopManagerAssignments: WorkshopManagerAssignment[];
  let workshopManagers: UserSummary[];
  let venues: Venue[];
  try {
    [batch, assignments, trainers, workshopManagerAssignments, workshopManagers, venues] = await Promise.all([
      apiFetch<Batch>(`/workshops/${workshopId}/batches/${batchId}?${orgQuery}`, { accessToken }),
      apiFetch<TrainerAssignment[]>(`/workshops/${workshopId}/batches/${batchId}/trainer-assignments?${orgQuery}`, { accessToken }),
      apiFetch<UserSummary[]>(`/users?roleCode=trainer&${orgQuery}`, { accessToken }),
      apiFetch<WorkshopManagerAssignment[]>(`/workshops/${workshopId}/batches/${batchId}/workshop-manager-assignments?${orgQuery}`, {
        accessToken,
      }),
      apiFetch<UserSummary[]>(`/users?roleCode=workshop_manager&${orgQuery}`, { accessToken }),
      apiFetch<Venue[]>(`/venues?${orgQuery}`, { accessToken }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/dashboard/workshops/${workshopId}/batches/${batchId}?projectId=${projectId}`} className="text-sm text-slate-500 hover:text-slate-800">
          ← {batch.name}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            {batch.name} <span className="text-slate-400">({batch.code})</span>
          </h1>
          <StatusPill status={batch.status} />
        </div>
      </div>

      <BatchTabs workshopId={workshopId} batchId={batchId} projectId={projectId} />

      <BatchManagePanel
        projectId={projectId}
        workshopId={workshopId}
        batch={batch}
        assignments={assignments}
        trainers={trainers}
        workshopManagerAssignments={workshopManagerAssignments}
        workshopManagers={workshopManagers}
        venues={venues}
      />
    </div>
  );
}
