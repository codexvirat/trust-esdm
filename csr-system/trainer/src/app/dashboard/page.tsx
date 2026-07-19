import Link from "next/link";
import { requireTrainerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import type { TrainerAssignment, WorkshopSummary, Batch } from "@/lib/types";

export default async function TrainerDashboardPage() {
  const { accessToken, user } = await requireTrainerRole();

  const assignments = await apiFetch<TrainerAssignment[]>("/me/trainer-assignments", { accessToken });

  const [workshops, batches] = await Promise.all([
    Promise.all(assignments.map((a) => apiFetch<WorkshopSummary>(`/workshops/${a.workshopId}`, { accessToken }))),
    Promise.all(assignments.map((a) => apiFetch<Batch>(`/workshops/${a.workshopId}/batches/${a.batchId}`, { accessToken }))),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Batches you&apos;re assigned to train.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment, i) => {
          const workshop = workshops[i]!;
          const batch = batches[i]!;
          return (
            <Link
              key={assignment._id}
              href={`/dashboard/workshops/${assignment.workshopId}/batches/${assignment.batchId}`}
              className="rounded-xl border border-slate-200 bg-white p-6 transition hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
                    {batch.name} · {batch.code}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{workshop.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()} ·{" "}
                    {assignment.roleInBatch === "lead" ? "Lead trainer" : "Co-trainer"}
                  </p>
                </div>
                <StatusPill status={batch.status} />
              </div>
            </Link>
          );
        })}
        {assignments.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            You haven&apos;t been assigned to any batches yet.
          </div>
        )}
      </div>
    </div>
  );
}
