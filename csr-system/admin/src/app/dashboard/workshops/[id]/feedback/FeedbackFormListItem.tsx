"use client";

import { useTransition } from "react";
import { setFeedbackEnabledAction } from "@/app/actions/feedback";
import type { FeedbackForm, FeedbackResponse } from "@/lib/types";

export function FeedbackFormListItem({
  projectId,
  workshopId,
  form,
  responses,
  batchName,
}: {
  projectId: string;
  workshopId: string;
  form: FeedbackForm;
  responses: FeedbackResponse[];
  batchName?: string;
}) {
  const [pending, startTransition] = useTransition();

  const avgCourseRating =
    responses.length > 0
      ? (responses.reduce((sum, r) => sum + (r.courseRating ?? 0), 0) / responses.filter((r) => r.courseRating != null).length || 0).toFixed(1)
      : null;

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {form.title || "Feedback form"} ({form.questions.length} question{form.questions.length === 1 ? "" : "s"}){" "}
            <span className="font-normal text-slate-400">— {form.batchId ? `Batch: ${batchName ?? "unknown"}` : "whole workshop"}</span>
          </p>
          <p className="text-xs text-slate-500">
            {responses.length} response{responses.length === 1 ? "" : "s"}
            {avgCourseRating && ` · avg course rating ${avgCourseRating}/5`}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setFeedbackEnabledAction(projectId, workshopId, form._id, !form.isEnabled))}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-60 ${
            form.isEnabled ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {pending ? "Updating…" : form.isEnabled ? "Enabled — click to disable" : "Disabled — click to enable"}
        </button>
      </div>

      {responses.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {responses.slice(0, 5).map((r) => (
            <li key={r._id} className="text-xs text-slate-500">
              {r.courseRating != null && `Course: ${r.courseRating}/5`}
              {r.trainerRating != null && ` · Trainer: ${r.trainerRating}/5`}
              {r.comments && ` — "${r.comments}"`}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
