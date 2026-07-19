"use client";

import { useTransition } from "react";
import { setAssessmentEnabledAction } from "@/app/actions/assessments";
import type { Assessment, AssessmentAttempt } from "@/lib/types";

export function AssessmentListItem({
  workshopId,
  batchId,
  assessment,
  attempts,
}: {
  workshopId: string;
  batchId: string;
  assessment: Assessment;
  attempts: AssessmentAttempt[];
}) {
  const [pending, startTransition] = useTransition();

  const submitted = attempts.filter((a) => a.status !== "in_progress");
  const passed = submitted.filter((a) => a.result === "pass").length;

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">{assessment.title}</p>
          <p className="text-xs text-slate-500">
            {assessment.questions.length} question{assessment.questions.length === 1 ? "" : "s"} · {assessment.totalMarks} marks · pass at{" "}
            {assessment.passingPercent}% · {assessment.durationMinutes} min
          </p>
          {submitted.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {submitted.length} attempt{submitted.length === 1 ? "" : "s"} submitted · {passed} passed
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setAssessmentEnabledAction(workshopId, batchId, assessment._id, !assessment.isEnabled))}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-60 ${
            assessment.isEnabled ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {pending ? "Updating…" : assessment.isEnabled ? "Enabled — click to disable" : "Disabled — click to enable"}
        </button>
      </div>

      {submitted.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {submitted.map((a) => (
            <span
              key={a._id}
              className={`rounded-full px-2 py-0.5 text-xs ${a.result === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
            >
              Attempt {a.attemptNumber}: {a.percentage}% ({a.result})
            </span>
          ))}
        </ul>
      )}
    </li>
  );
}
