"use client";

import { useTransition } from "react";
import { deleteFeedbackQuestionAction } from "@/app/actions/feedbackQuestionBank";
import type { FeedbackBankQuestion } from "@/lib/types";

export function FeedbackQuestionRow({ projectId, question }: { projectId: string; question: FeedbackBankQuestion }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">{question.questionText}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {question.type} · {question.required ? "required" : "optional"}
            {question.tags.length > 0 && ` · ${question.tags.join(", ")}`}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Delete this question?")) startTransition(() => deleteFeedbackQuestionAction(projectId, question._id));
          }}
          className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
