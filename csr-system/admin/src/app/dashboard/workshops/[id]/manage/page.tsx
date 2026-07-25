import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { WorkshopSummary } from "@/lib/types";
import { setWorkshopStatusAction } from "@/app/actions/workshops";
import { WorkshopHeader, nextStatusActions } from "../WorkshopHeader";
import { EditWorkshopForm } from "../EditWorkshopForm";
import { DeleteWorkshopButton } from "../DeleteWorkshopButton";

export default async function WorkshopManagePage({
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
  try {
    workshop = await apiFetch<WorkshopSummary>(`/workshops/${id}?projectId=${projectId}`, { accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const nextActions = nextStatusActions(workshop.status);

  return (
    <div className="flex flex-col gap-6">
      <WorkshopHeader workshop={workshop} projectId={projectId} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Status</h2>
        <p className="mt-1 text-sm text-slate-500">Change the workshop&apos;s lifecycle status.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {nextActions.length === 0 && <p className="text-sm text-slate-400">No status changes available.</p>}
          {nextActions.map((action) => (
            <form key={action.status} action={setWorkshopStatusAction.bind(null, projectId, workshop._id, action.status)}>
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
        </div>
      </div>

      <EditWorkshopForm workshop={workshop} projectId={projectId} />

      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-base font-semibold text-red-900">Danger zone</h2>
        <p className="mt-1 text-sm text-red-700">Deleting a workshop also removes its batches, enrollments, attendance, and certificates.</p>
        <div className="mt-4">
          <DeleteWorkshopButton projectId={projectId} workshopId={workshop._id} workshopTitle={workshop.title} />
        </div>
      </div>
    </div>
  );
}
