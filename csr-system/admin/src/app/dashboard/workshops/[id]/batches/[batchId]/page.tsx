import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  Assessment,
  AssessmentAttempt,
  AttendanceRecord,
  AttendanceSession,
  Batch,
  CertificateEligibility,
  CertificateTemplate,
  Enrollment,
  FeedbackForm,
  UserSummary,
} from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { CreateSessionForm } from "./CreateSessionForm";
import { SessionsPanel } from "./SessionsPanel";
import { CandidateRow } from "./CandidateRow";
import { AssessmentAssignPanel } from "./AssessmentAssignPanel";
import { FeedbackAssignPanel } from "./FeedbackAssignPanel";
import { BatchResultsPanel } from "./BatchResultsPanel";
import { BatchPhotosPanel } from "./BatchPhotosPanel";
import { DayPlanPanel } from "./DayPlanPanel";
import { GenerateCertificatesPanel } from "./GenerateCertificatesPanel";

const DAY_PLAN_ASSIGNABLE_ROLES = new Set(["super_admin", "admin", "manager", "workshop_manager"]);

export default async function BatchDetailPage({
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
  let sessions: AttendanceSession[];
  let records: AttendanceRecord[];
  let enrollments: Enrollment[];
  let candidates: UserSummary[];
  let templates: CertificateTemplate[];
  let assessments: Assessment[];
  let feedbackForms: FeedbackForm[];
  let projectUsers: UserSummary[];
  try {
    [batch, sessions, records, enrollments, candidates, templates, assessments, feedbackForms, projectUsers] = await Promise.all([
      apiFetch<Batch>(`/workshops/${workshopId}/batches/${batchId}?${orgQuery}`, { accessToken }),
      apiFetch<AttendanceSession[]>(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions?${orgQuery}`, { accessToken }),
      apiFetch<AttendanceRecord[]>(`/attendance/records?batchId=${batchId}&${orgQuery}`, { accessToken }),
      apiFetch<Enrollment[]>(`/enrollments?batchId=${batchId}&${orgQuery}`, { accessToken }),
      apiFetch<UserSummary[]>(`/users?roleCode=candidate&${orgQuery}`, { accessToken }),
      apiFetch<CertificateTemplate[]>(`/certificate-templates?${orgQuery}`, { accessToken }),
      apiFetch<Assessment[]>(`/workshops/${workshopId}/assessments?${orgQuery}`, { accessToken }),
      apiFetch<FeedbackForm[]>(`/workshops/${workshopId}/feedback-forms?${orgQuery}`, { accessToken }),
      apiFetch<UserSummary[]>(`/users?${orgQuery}`, { accessToken }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const candidateById = new Map(candidates.map((c) => [c._id, c]));
  const dayPlanStaff = projectUsers.filter((u) => DAY_PLAN_ASSIGNABLE_ROLES.has(u.roleCode));

  const eligibilities = await Promise.all(
    enrollments.map((e) => apiFetch<CertificateEligibility>(`/enrollments/${e._id}/certificate/eligibility?${orgQuery}`, { accessToken })),
  );

  const batchAssessments = assessments.filter((a) => a.batchId === batchId);
  const batchAttempts = await Promise.all(
    batchAssessments.map((a) =>
      apiFetch<AssessmentAttempt[]>(`/workshops/${workshopId}/assessments/${a._id}/attempts?${orgQuery}`, { accessToken }),
    ),
  );

  const revalidatePathTarget = `/dashboard/workshops/${workshopId}/batches/${batchId}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/dashboard/workshops/${workshopId}?projectId=${projectId}`} className="text-sm text-slate-500 hover:text-slate-800">
          ← {batch.name}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            {batch.name} <span className="text-slate-400">({batch.code})</span>
          </h1>
          <StatusPill status={batch.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()} · {enrollments.length} enrolled
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AssessmentAssignPanel projectId={projectId} workshopId={workshopId} batchId={batchId} assessments={assessments} />
        <FeedbackAssignPanel projectId={projectId} workshopId={workshopId} batchId={batchId} forms={feedbackForms} />
      </div>

      <BatchPhotosPanel projectId={projectId} workshopId={workshopId} batchId={batchId} photos={batch.photos ?? []} />

      <DayPlanPanel projectId={projectId} workshopId={workshopId} batchId={batchId} entries={batch.dayPlan ?? []} staff={dayPlanStaff} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Attendance sessions</h2>
          <CreateSessionForm projectId={projectId} workshopId={workshopId} batchId={batchId} />
        </div>
        <div className="mt-4">
          <SessionsPanel
            projectId={projectId}
            workshopId={workshopId}
            batchId={batchId}
            sessions={sessions}
            records={records}
            candidates={enrollments.map((e) => candidateById.get(e.candidateUserId)).filter((c): c is UserSummary => Boolean(c))}
          />
        </div>
      </div>

      <GenerateCertificatesPanel projectId={projectId} workshopId={workshopId} batchId={batchId} templates={templates} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Candidates</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {enrollments.map((enrollment, i) => (
            <CandidateRow
              key={enrollment._id}
              projectId={projectId}
              enrollment={enrollment}
              candidate={candidateById.get(enrollment.candidateUserId)}
              eligibility={eligibilities[i]!}
              templates={templates}
              hasCertificate={enrollment.status === "certified"}
              revalidatePathTarget={revalidatePathTarget}
            />
          ))}
          {enrollments.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No candidates enrolled in this batch yet.</li>}
        </ul>
      </div>

      <BatchResultsPanel assessments={batchAssessments} attemptsByAssessment={batchAttempts} candidateById={candidateById} />
    </div>
  );
}
