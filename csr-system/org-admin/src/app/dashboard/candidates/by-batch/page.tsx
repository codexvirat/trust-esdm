import Link from "next/link";
import { requireOrgAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Batch, Enrollment, UserSummary, WorkshopSummary } from "@/lib/types";
import { BatchCandidatesBoard, type BatchCard } from "./BatchCandidatesBoard";

export default async function CandidatesByBatchPage() {
  const { accessToken } = await requireOrgAdminRole();

  const [candidates, workshops, enrollments] = await Promise.all([
    apiFetch<UserSummary[]>("/users?roleCode=candidate", { accessToken }),
    apiFetch<WorkshopSummary[]>("/workshops", { accessToken }),
    apiFetch<Enrollment[]>("/enrollments", { accessToken }),
  ]);

  const batchLists = await Promise.all(workshops.map((w) => apiFetch<Batch[]>(`/workshops/${w._id}/batches`, { accessToken })));

  const batches: BatchCard[] = workshops.flatMap((workshop, i) =>
    (batchLists[i] ?? []).map((b) => ({ _id: b._id, name: b.name, code: b.code, workshopTitle: workshop.title })),
  );

  const candidateById: Record<string, UserSummary> = {};
  candidates.forEach((c) => {
    candidateById[c._id] = c;
  });

  const enrollmentsByBatch: Record<string, Enrollment[]> = {};
  enrollments.forEach((e) => {
    const list = enrollmentsByBatch[e.batchId] ?? [];
    list.push(e);
    enrollmentsByBatch[e.batchId] = list;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Candidates by batch</h1>
          <p className="mt-1 text-sm text-slate-500">Pick a batch to see who&apos;s enrolled, and click a name for their profile.</p>
        </div>
        <Link href="/dashboard/candidates" className="text-sm font-medium text-teal-700 hover:text-teal-900">
          ← All candidates
        </Link>
      </div>

      <BatchCandidatesBoard batches={batches} enrollmentsByBatch={enrollmentsByBatch} candidateById={candidateById} />
    </div>
  );
}
