import Link from "next/link";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Assessment, AssessmentAttempt, Batch } from "@/lib/types";

function summarize(assessments: Assessment[], attemptsByAssessment: AssessmentAttempt[][]) {
  const submitted = assessments.flatMap((a, i) => (attemptsByAssessment[i] ?? []).filter((at) => at.status !== "in_progress"));
  const passed = submitted.filter((a) => a.result === "pass").length;
  const avgPercent = submitted.length > 0 ? Math.round(submitted.reduce((sum, a) => sum + a.percentage, 0) / submitted.length) : null;
  return { attempted: submitted.length, passed, avgPercent };
}

export default async function WorkshopResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workshopId } = await params;
  const { accessToken } = await requireManagerRole();

  const [batches, assessments] = await Promise.all([
    apiFetch<Batch[]>(`/workshops/${workshopId}/batches`, { accessToken }),
    apiFetch<Assessment[]>(`/workshops/${workshopId}/assessments`, { accessToken }),
  ]);

  const attemptsByAssessment = await Promise.all(
    assessments.map((a) => apiFetch<AssessmentAttempt[]>(`/workshops/${workshopId}/assessments/${a._id}/attempts`, { accessToken })),
  );

  const workshopWideAssessments = assessments.filter((a) => !a.batchId);
  const workshopWideAttempts = attemptsByAssessment.filter((_, i) => !assessments[i]!.batchId);
  const workshopWideSummary = summarize(workshopWideAssessments, workshopWideAttempts);

  const batchRows = batches.map((batch) => {
    const idx = assessments.map((a, i) => (a.batchId === batch._id ? i : -1)).filter((i) => i !== -1);
    const batchAssessments = idx.map((i) => assessments[i]!);
    const batchAttempts = idx.map((i) => attemptsByAssessment[i]!);
    return { batch, ...summarize(batchAssessments, batchAttempts), hasAssessment: batchAssessments.length > 0 };
  });

  return (
    <div className="flex flex-col gap-6">
      {workshopWideAssessments.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Workshop-wide</h2>
          <p className="mt-1 text-xs text-slate-500">Assessments not scoped to a single batch — apply to every candidate in the workshop.</p>
          <p className="mt-3 text-sm text-slate-700">
            {workshopWideSummary.attempted} submitted · {workshopWideSummary.passed} passed
            {workshopWideSummary.avgPercent !== null && ` · avg ${workshopWideSummary.avgPercent}%`}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Attempted</th>
              <th className="px-4 py-3">Passed</th>
              <th className="px-4 py-3">Avg %</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batchRows.map(({ batch, attempted, passed, avgPercent, hasAssessment }) => (
              <tr key={batch._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {batch.name} <span className="text-slate-400">({batch.code})</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{batch.enrolledCount}</td>
                <td className="px-4 py-3 text-slate-600">{hasAssessment ? attempted : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{hasAssessment ? passed : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{avgPercent !== null ? `${avgPercent}%` : "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/workshops/${workshopId}/batches/${batch._id}`} className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline">
                    View details →
                  </Link>
                </td>
              </tr>
            ))}
            {batchRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No batches for this workshop yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
