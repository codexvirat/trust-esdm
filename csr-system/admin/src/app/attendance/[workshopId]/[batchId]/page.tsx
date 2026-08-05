import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { AttendanceRecord, AttendanceSession, Batch, Enrollment, UserSummary } from "@/lib/types";
import { CreateSessionForm } from "@/app/dashboard/workshops/[id]/batches/[batchId]/CreateSessionForm";
import { SessionsPanel } from "@/app/dashboard/workshops/[id]/batches/[batchId]/SessionsPanel";

export default async function MobileAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ workshopId: string; batchId: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { workshopId, batchId } = await params;
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;
  const orgQuery = `projectId=${projectId}`;

  let batch: Batch;
  let sessions: AttendanceSession[];
  let records: AttendanceRecord[];
  let enrollments: Enrollment[];
  let candidates: UserSummary[];
  try {
    [batch, sessions, records, enrollments, candidates] = await Promise.all([
      apiFetch<Batch>(`/workshops/${workshopId}/batches/${batchId}?${orgQuery}`, { accessToken }),
      apiFetch<AttendanceSession[]>(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions?${orgQuery}`, { accessToken }),
      apiFetch<AttendanceRecord[]>(`/attendance/records?batchId=${batchId}&${orgQuery}`, { accessToken }),
      apiFetch<Enrollment[]>(`/enrollments?batchId=${batchId}&${orgQuery}`, { accessToken }),
      apiFetch<UserSummary[]>(`/users?roleCode=candidate&${orgQuery}`, { accessToken }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const candidateById = new Map(candidates.map((c) => [c._id, c]));
  const enrolledCandidates = enrollments.map((e) => candidateById.get(e.candidateUserId)).filter((c): c is UserSummary => Boolean(c));

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-4 bg-slate-100 p-4">
      <div>
        <Link
          href={`/dashboard/workshops/${workshopId}/batches/${batchId}?projectId=${projectId}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Overview
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {batch.name} <span className="text-slate-400">({batch.code})</span>
        </h1>
        <p className="text-sm text-slate-500">Attendance</p>
      </div>

      {batch.isLocked && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">🔒 This batch is locked.</p>
          <p className="mt-0.5 text-sm text-amber-800">Attendance is read-only until it's unlocked from the Manage tab.</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-slate-900">Attendance sessions</h2>
          <CreateSessionForm projectId={projectId} workshopId={workshopId} batchId={batchId} locked={batch.isLocked} />
        </div>
        <div className="mt-4">
          <SessionsPanel
            projectId={projectId}
            workshopId={workshopId}
            batchId={batchId}
            sessions={sessions}
            records={records}
            candidates={enrolledCandidates}
            locked={batch.isLocked}
          />
        </div>
      </div>
    </div>
  );
}
