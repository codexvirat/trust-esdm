import type { Assessment, AssessmentAttempt, UserSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";

export function BatchResultsPanel({
  assessments,
  attemptsByAssessment,
  candidateById,
}: {
  assessments: Assessment[];
  attemptsByAssessment: AssessmentAttempt[][];
  candidateById: Map<string, UserSummary>;
}) {
  if (assessments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Results</h2>
        <p className="mt-4 py-6 text-center text-sm text-slate-400">No assessment assigned to this batch yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">Results</h2>

      <div className="mt-4 flex flex-col gap-6">
        {assessments.map((assessment, i) => {
          const attempts = attemptsByAssessment[i] ?? [];
          const submitted = attempts.filter((a) => a.status !== "in_progress");
          const passed = submitted.filter((a) => a.result === "pass").length;
          const avgPercent = submitted.length > 0 ? Math.round(submitted.reduce((sum, a) => sum + a.percentage, 0) / submitted.length) : null;

          return (
            <div key={assessment._id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{assessment.title}</p>
                <p className="text-xs text-slate-500">
                  {submitted.length} submitted · {passed} passed{avgPercent !== null && ` · avg ${avgPercent}%`}
                </p>
              </div>

              {submitted.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">No one has submitted this assessment yet.</p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Candidate</th>
                        <th className="px-3 py-2">Attempt</th>
                        <th className="px-3 py-2">Score</th>
                        <th className="px-3 py-2">%</th>
                        <th className="px-3 py-2">Result</th>
                        <th className="px-3 py-2">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submitted.map((attempt) => (
                        <tr key={attempt._id}>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {candidateById.get(attempt.candidateUserId)?.fullName ?? "Unknown candidate"}
                          </td>
                          <td className="px-3 py-2 text-slate-600">#{attempt.attemptNumber}</td>
                          <td className="px-3 py-2 text-slate-600">{attempt.score}</td>
                          <td className="px-3 py-2 text-slate-600">{attempt.percentage}%</td>
                          <td className="px-3 py-2">{attempt.result && <StatusPill status={attempt.result} />}</td>
                          <td className="px-3 py-2 text-slate-500">
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
