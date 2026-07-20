import Link from "next/link";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Batch, Enrollment, Project, UserSummary, WorkshopSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { ProjectFilter } from "@/components/ProjectFilter";

export default async function CandidatesByBatchPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [projects, candidates, workshops, enrollments] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<UserSummary[]>(`/users?roleCode=candidate&projectId=${projectId}`, { accessToken }),
    apiFetch<WorkshopSummary[]>(`/workshops?projectId=${projectId}`, { accessToken }),
    apiFetch<Enrollment[]>(`/enrollments?projectId=${projectId}`, { accessToken }),
  ]);

  const batchLists = await Promise.all(
    workshops.map((w) => apiFetch<Batch[]>(`/workshops/${w._id}/batches?projectId=${projectId}`, { accessToken })),
  );

  const candidateById = new Map(candidates.map((c) => [c._id, c]));
  const enrollmentsByBatch = new Map<string, Enrollment[]>();
  enrollments.forEach((e) => {
    const list = enrollmentsByBatch.get(e.batchId) ?? [];
    list.push(e);
    enrollmentsByBatch.set(e.batchId, list);
  });

  const hasAnyBatch = batchLists.some((list) => list.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Candidates by batch</h1>
          <p className="mt-1 text-sm text-slate-500">Every candidate, grouped by the batch they&apos;re enrolled in.</p>
        </div>
        <Link href={`/dashboard/candidates?projectId=${projectId}`} className="text-sm font-medium text-teal-700 hover:text-teal-900">
          ← All candidates
        </Link>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/candidates/by-batch" />

      {workshops.map((workshop, i) => {
        const batches = batchLists[i] ?? [];
        if (batches.length === 0) return null;
        return (
          <div key={workshop._id} className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-slate-900">{workshop.title}</h2>
            {batches.map((batch) => {
              const batchEnrollments = enrollmentsByBatch.get(batch._id) ?? [];
              return (
                <div key={batch._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <Link
                      href={`/dashboard/workshops/${workshop._id}/batches/${batch._id}?projectId=${projectId}`}
                      className="text-sm font-medium text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      {batch.name} <span className="text-slate-400">({batch.code})</span>
                    </Link>
                    <span className="text-xs text-slate-500">{batchEnrollments.length} enrolled</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {batchEnrollments.map((e) => {
                      const candidate = candidateById.get(e.candidateUserId);
                      return (
                        <li key={e._id} className="flex items-center justify-between px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium text-slate-900">{candidate?.fullName ?? "Unknown candidate"}</p>
                            <p className="text-xs text-slate-500">{candidate?.email}</p>
                          </div>
                          <StatusPill status={e.status} />
                        </li>
                      );
                    })}
                    {batchEnrollments.length === 0 && (
                      <li className="px-4 py-6 text-center text-sm text-slate-400">No candidates enrolled in this batch yet.</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      })}

      {!hasAnyBatch && <p className="text-center text-sm text-slate-400">No batches yet for this project.</p>}
    </div>
  );
}
