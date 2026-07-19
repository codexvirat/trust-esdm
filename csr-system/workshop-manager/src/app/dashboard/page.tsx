import { requireWorkshopManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { WorkshopManagerAssignment, WorkshopSummary, Batch, TrainerAssignment, UserSummary, Venue } from "@/lib/types";
import { WorkshopManagerBatchCard } from "./WorkshopManagerBatchCard";

export default async function DashboardOverviewPage() {
  const { accessToken, user } = await requireWorkshopManagerRole();

  const assignments = await apiFetch<WorkshopManagerAssignment[]>("/me/workshop-manager-assignments", { accessToken });

  const [workshops, batches, trainerAssignmentsByBatch] = await Promise.all([
    Promise.all(assignments.map((a) => apiFetch<WorkshopSummary>(`/workshops/${a.workshopId}`, { accessToken }))),
    Promise.all(assignments.map((a) => apiFetch<Batch>(`/workshops/${a.workshopId}/batches/${a.batchId}`, { accessToken }))),
    Promise.all(
      assignments.map((a) => apiFetch<TrainerAssignment[]>(`/workshops/${a.workshopId}/batches/${a.batchId}/trainer-assignments`, { accessToken })),
    ),
  ]);

  const trainers = await apiFetch<UserSummary[]>("/users?roleCode=trainer", { accessToken });
  const venues = await apiFetch<Venue[]>("/venues", { accessToken });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Batches you&apos;re assigned to manage.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment, i) => (
          <WorkshopManagerBatchCard
            key={assignment._id}
            workshop={workshops[i]!}
            batch={batches[i]!}
            assignments={trainerAssignmentsByBatch[i]!}
            trainers={trainers}
            venues={venues}
          />
        ))}
        {assignments.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            You haven&apos;t been assigned to any batches yet.
          </div>
        )}
      </div>
    </div>
  );
}
