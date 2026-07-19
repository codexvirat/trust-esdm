import Link from "next/link";
import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { AssessmentAttempt, CandidateAssessment, Enrollment } from "@/lib/types";

export default async function AssessmentsListPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await params;
  const { accessToken } = await requireCandidateRole();

  const enrollment = await apiFetch<Enrollment>(`/enrollments/${enrollmentId}`, { accessToken });
  const assessments = await apiFetch<CandidateAssessment[]>(`/workshops/${enrollment.workshopId}/assessments`, { accessToken });

  const attemptsByAssessment = await Promise.all(
    assessments.map((a) => apiFetch<AssessmentAttempt[]>(`/workshops/${enrollment.workshopId}/assessments/${a.id}/attempts/mine`, { accessToken })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Assessments</h1>
        <p className="mt-1 text-sm text-slate-500">Attempt any open assessment for this training.</p>
      </div>

      <div className="flex flex-col gap-3">
        {assessments.map((assessment, i) => {
          const attempts = attemptsByAssessment[i]!;
          const best = attempts.reduce<AssessmentAttempt | null>(
            (acc, cur) => (!acc || cur.percentage > acc.percentage ? cur : acc),
            null,
          );
          const hasPassed = attempts.some((a) => a.result === "pass");
          const inProgress = attempts.some((a) => a.status === "in_progress");
          const exhausted = attempts.filter((a) => a.status !== "in_progress").length >= assessment.maxAttempts;

          let actionLabel = "Start assessment";
          if (inProgress) actionLabel = "Resume assessment";
          else if (hasPassed) actionLabel = "View result";
          else if (exhausted) actionLabel = "View result";

          return (
            <div key={assessment.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{assessment.title}</p>
                  {assessment.description && <p className="mt-1 text-xs text-slate-500">{assessment.description}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    {assessment.questions.length} questions · {assessment.durationMinutes} min · pass at {assessment.passingPercent}% ·
                    up to {assessment.maxAttempts} attempt{assessment.maxAttempts > 1 ? "s" : ""}
                  </p>
                  {best && (
                    <p className="mt-1 text-xs">
                      Best score: <span className="font-medium text-slate-900">{best.percentage}%</span>{" "}
                      <span className={hasPassed ? "text-emerald-700" : "text-slate-500"}>{hasPassed ? "· Passed" : ""}</span>
                    </p>
                  )}
                </div>
                <Link
                  href={`/dashboard/trainings/${enrollmentId}/assessments/${assessment.id}`}
                  className="shrink-0 rounded-md bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
                >
                  {actionLabel}
                </Link>
              </div>
            </div>
          );
        })}
        {assessments.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No assessments are open for this training yet.
          </p>
        )}
      </div>
    </div>
  );
}
