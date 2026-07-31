"use client";

import { useState, useTransition } from "react";
import { updateFeedbackFormAction } from "@/app/actions/feedback";
import type { FeedbackForm, FeedbackFormQuestion, FeedbackQuestionType } from "@/lib/types";

export function EditFeedbackForm({
  projectId,
  workshopId,
  form,
  onDone,
}: {
  projectId: string;
  workshopId: string;
  form: FeedbackForm;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(form.title ?? "");
  const [questions, setQuestions] = useState<FeedbackFormQuestion[]>(form.questions);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function update(index: number, patch: Partial<FeedbackFormQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function submit() {
    setError(undefined);
    const cleaned = questions.map((q) => {
      if (q.type === "grid") return { ...q, rows: (q.rows ?? []).map((r) => r.trim()).filter(Boolean) };
      if (q.type === "mcq") return { ...q, options: (q.options ?? []).map((o) => o.trim()).filter(Boolean) };
      return q;
    });
    startTransition(async () => {
      const result = await updateFeedbackFormAction(projectId, workshopId, form._id, title, cleaned);
      if (result.error) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-fb-title-${form._id}`} className="text-sm font-medium text-slate-700">
          Form name
        </label>
        <input
          id={`edit-fb-title-${form._id}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {questions.map((q, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-2">
            <div className="flex items-center gap-2">
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
                <option value="grid">Multiple choice grid (1-5)</option>
                <option value="mcq">Multiple choice (options)</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input type="checkbox" checked={q.required} onChange={(e) => update(index, { required: e.target.checked })} />
                Required
              </label>
              <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== index))} className="text-sm text-red-600 hover:bg-red-50 rounded-md px-2 py-2">
                Remove
              </button>
            </div>
            {q.type === "grid" && (
              <textarea
                value={(q.rows ?? []).join("\n")}
                onChange={(e) => update(index, { rows: e.target.value.split("\n") })}
                onBlur={(e) =>
                  update(index, {
                    rows: e.target.value
                      .split("\n")
                      .map((r) => r.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={"One topic per line"}
                rows={4}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            )}
            {q.type === "mcq" && (
              <>
                <textarea
                  value={(q.options ?? []).join("\n")}
                  onChange={(e) => update(index, { options: e.target.value.split("\n") })}
                  onBlur={(e) =>
                    update(index, {
                      options: e.target.value
                        .split("\n")
                        .map((o) => o.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={"One option per line"}
                  rows={4}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={q.allowMultiple ?? false}
                    onChange={(e) => update(index, { allowMultiple: e.target.checked })}
                  />
                  Allow selecting multiple options (checkboxes instead of single-select)
                </label>
              </>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, { questionText: "", type: "rating", required: true }])}
          className="self-start rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white"
        >
          + Add question
        </button>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={pending || !title.trim() || questions.length === 0}
          onClick={submit}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-slate-500 hover:text-slate-800">
          Cancel
        </button>
      </div>
    </div>
  );
}
