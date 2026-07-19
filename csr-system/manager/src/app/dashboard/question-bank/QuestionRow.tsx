"use client";

import { useTransition } from "react";
import { deleteQuestionAction } from "@/app/actions/questionBank";
import type { Question } from "@/lib/types";

export function QuestionRow({ question }: { question: Question }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">{question.questionText}</p>
          <p className="text-xs text-slate-500">
            {question.options.map((o) => o.text).join(" · ")} — correct: {question.options.filter((o) => o.isCorrect).map((o) => o.text).join(", ")}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {question.marks} marks · {question.difficulty}
            {question.tags.length > 0 && ` · ${question.tags.join(", ")}`}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Delete this question?")) startTransition(() => deleteQuestionAction(question._id));
          }}
          className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
