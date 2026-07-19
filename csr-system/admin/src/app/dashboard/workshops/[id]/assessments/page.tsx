import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Assessment, AssessmentAttempt, Batch, WorkshopSummary, Question } from "@/lib/types";
import { WorkshopHeader } from "../WorkshopHeader";
import { CreateAssessmentForm } from "./CreateAssessmentForm";
import { AssessmentListItem } from "./AssessmentListItem";

export default async function AssessmentsTabPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { id: workshopId } = await params;
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [workshop, assessments, bankQuestions, batches] = await Promise.all([
    apiFetch<WorkshopSummary>(`/workshops/${workshopId}?projectId=${projectId}`, { accessToken }),
    apiFetch<Assessment[]>(`/workshops/${workshopId}/assessments?projectId=${projectId}`, { accessToken }),
    apiFetch<Question[]>(`/question-bank?projectId=${projectId}`, { accessToken }),
    apiFetch<Batch[]>(`/workshops/${workshopId}/batches?projectId=${projectId}`, { accessToken }),
  ]);
  const attemptsByAssessment = await Promise.all(
    assessments.map((a) => apiFetch<AssessmentAttempt[]>(`/workshops/${workshopId}/assessments/${a._id}/attempts?projectId=${projectId}`, { accessToken })),
  );
  const batchNameById = new Map(batches.map((b) => [b._id, b.name]));

  return (
    <div className="flex flex-col gap-6">
      <WorkshopHeader workshop={workshop} projectId={projectId} />

      <CreateAssessmentForm projectId={projectId} workshopId={workshopId} bankQuestions={bankQuestions} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {assessments.map((assessment, i) => (
            <AssessmentListItem
              key={assessment._id}
              projectId={projectId}
              workshopId={workshopId}
              assessment={assessment}
              attempts={attemptsByAssessment[i] ?? []}
              batchName={assessment.batchId ? batchNameById.get(assessment.batchId) : undefined}
            />
          ))}
          {assessments.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No assessments yet.</li>}
        </ul>
      </div>
    </div>
  );
}
