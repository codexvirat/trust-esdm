import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { AssessmentAttempt, CandidateAssessment, Enrollment } from "@/lib/types";
import { AttemptRunner } from "./AttemptRunner";

export default async function AssessmentAttemptPage({
  params,
}: {
  params: Promise<{ enrollmentId: string; assessmentId: string }>;
}) {
  const { enrollmentId, assessmentId } = await params;
  const { accessToken } = await requireCandidateRole();

  const enrollment = await apiFetch<Enrollment>(`/enrollments/${enrollmentId}`, { accessToken });
  const [assessment, attempts] = await Promise.all([
    apiFetch<CandidateAssessment>(`/workshops/${enrollment.workshopId}/assessments/${assessmentId}`, { accessToken }),
    apiFetch<AssessmentAttempt[]>(`/workshops/${enrollment.workshopId}/assessments/${assessmentId}/attempts/mine`, { accessToken }),
  ]);

  return (
    <AttemptRunner
      workshopId={enrollment.workshopId}
      assessmentId={assessmentId}
      enrollmentId={enrollmentId}
      assessment={assessment}
      initialAttempts={attempts}
    />
  );
}
