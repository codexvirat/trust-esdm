import { requireOrgAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Assessment, AssessmentAttempt } from "@/lib/types";
import { CreateAssessmentForm } from "./CreateAssessmentForm";
import { AssessmentListItem } from "./AssessmentListItem";

export default async function AssessmentsTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workshopId } = await params;
  const { accessToken } = await requireOrgAdminRole();

  const assessments = await apiFetch<Assessment[]>(`/workshops/${workshopId}/assessments`, { accessToken });
  const attemptsByAssessment = await Promise.all(
    assessments.map((a) => apiFetch<AssessmentAttempt[]>(`/workshops/${workshopId}/assessments/${a._id}/attempts`, { accessToken })),
  );

  return (
    <div className="flex flex-col gap-6">
      <CreateAssessmentForm workshopId={workshopId} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {assessments.map((assessment, i) => (
            <AssessmentListItem key={assessment._id} workshopId={workshopId} assessment={assessment} attempts={attemptsByAssessment[i] ?? []} />
          ))}
          {assessments.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No assessments yet.</li>}
        </ul>
      </div>
    </div>
  );
}
