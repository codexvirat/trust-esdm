import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { WorkshopSummary, Batch, Venue } from "@/lib/types";
import { CreateBatchForm } from "./CreateBatchForm";
import { BatchItem } from "./BatchItem";
import { WorkshopHeader } from "./WorkshopHeader";

export default async function WorkshopOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { id } = await params;
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  let workshop: WorkshopSummary;
  let batches: Batch[];
  let venues: Venue[];
  try {
    [workshop, batches, venues] = await Promise.all([
      apiFetch<WorkshopSummary>(`/workshops/${id}?projectId=${projectId}`, { accessToken }),
      apiFetch<Batch[]>(`/workshops/${id}/batches?projectId=${projectId}`, { accessToken }),
      apiFetch<Venue[]>(`/venues?projectId=${projectId}`, { accessToken }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkshopHeader workshop={workshop} projectId={projectId} />

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-4">
        <Info label="Type" value={workshop.type} />
        <Info label="Mode" value={workshop.mode} />
        <Info label="Enrolled" value={`${workshop.enrolledCount}${workshop.capacity ? ` / ${workshop.capacity}` : ""}`} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Batches</h2>
          <CreateBatchForm projectId={projectId} workshopId={workshop._id} venues={venues} />
        </div>

        {batches.length === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-slate-400">No batches yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {batches.map((batch) => (
              <BatchItem key={batch._id} projectId={projectId} workshopId={workshop._id} batch={batch} />
            ))}
          </div>
        )}
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
