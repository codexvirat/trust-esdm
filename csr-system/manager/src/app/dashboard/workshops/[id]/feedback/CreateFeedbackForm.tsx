"use client";

import { useState, useTransition } from "react";
import { createFeedbackFormAction } from "@/app/actions/feedback";
import type { FeedbackFormQuestion, FeedbackQuestionType } from "@/lib/types";

function blankQuestion(): FeedbackFormQuestion {
  return { questionText: "", type: "rating", required: true };
}

export function CreateFeedbackForm({ workshopId }: { workshopId: string }) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<FeedbackFormQuestion[]>([blankQuestion()]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New feedback form
      </button>
    );
  }

  function update(index: number, patch: Partial<FeedbackFormQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const result = await createFeedbackFormAction(workshopId, questions);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setQuestions([blankQuestion()]);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">New feedback form</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Cancel
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {questions.map((q, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={q.questionText}
              onChange={(e) => update(index, { questionText: e.target.value })}
              placeholder={`Question ${index + 1}`}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={q.type}
              onChange={(e) => update(index, { type: e.target.value as FeedbackQuestionType })}
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="rating">Rating (0-5)</option>
              <option value="nps">NPS</option>
              <option value="text">Free text</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-slate-600">
              <input type="checkbox" checked={q.required} onChange={(e) => update(index, { required: e.target.checked })} />
              Required
            </label>
            {questions.length > 1 && (
              <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== index))} className="text-sm text-red-600 hover:bg-red-50 rounded-md px-2 py-2">
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
          className="self-start rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          + Add question
        </button>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create feedback form"}
      </button>
    </div>
  );
}
