"use client";

import { useState, useTransition } from "react";
import { createAssessmentAction } from "@/app/actions/assessments";
import type { AssessmentQuestion, QuestionType } from "@/lib/types";

function blankQuestion(): AssessmentQuestion {
  return { questionText: "", type: "single_choice", marks: 5, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] };
}

export function CreateAssessmentForm({ workshopId }: { workshopId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingPercent, setPassingPercent] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([blankQuestion()]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New assessment
      </button>
    );
  }

  function updateQuestion(index: number, patch: Partial<AssessmentQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, patch: { text?: string; isCorrect?: boolean }) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) => {
          if (j !== oIndex) {
            // single_choice/true_false: selecting a new correct option clears the others
            return q.type !== "multiple_choice" && patch.isCorrect ? { ...o, isCorrect: false } : o;
          }
          return { ...o, ...patch };
        });
        return { ...q, options };
      }),
    );
  }

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const result = await createAssessmentAction(workshopId, {
        title,
        description: description || undefined,
        passingPercent,
        maxAttempts,
        durationMinutes,
        questions,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setTitle("");
        setDescription("");
        setQuestions([blankQuestion()]);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">New assessment</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Cancel
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="assessment-title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="assessment-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="assessment-description" className="text-sm font-medium text-slate-700">
            Description (optional)
          </label>
          <input
            id="assessment-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="assessment-passing" className="text-sm font-medium text-slate-700">
            Passing %
          </label>
          <input
            id="assessment-passing"
            type="number"
            min={0}
            max={100}
            value={passingPercent}
            onChange={(e) => setPassingPercent(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="assessment-attempts" className="text-sm font-medium text-slate-700">
            Max attempts
          </label>
          <input
            id="assessment-attempts"
            type="number"
            min={1}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="assessment-duration" className="text-sm font-medium text-slate-700">
            Duration (minutes)
          </label>
          <input
            id="assessment-duration"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-900">Questions</h3>
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <input
                value={q.questionText}
                onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                placeholder={`Question ${qIndex + 1}`}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={q.type}
                onChange={(e) => {
                  const type = e.target.value as QuestionType;
                  const options = type === "true_false" ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }] : q.options;
                  updateQuestion(qIndex, { type, options });
                }}
                className="rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="single_choice">Single choice</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="true_false">True / False</option>
              </select>
              <input
                type="number"
                min={0}
                value={q.marks}
                onChange={(e) => updateQuestion(qIndex, { marks: Number(e.target.value) })}
                className="w-20 rounded-md border border-slate-300 px-2 py-2 text-sm"
                title="Marks"
              />
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qIndex))}
                  className="rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2 pl-2">
              {q.options.map((o, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type={q.type === "multiple_choice" ? "checkbox" : "radio"}
                    name={`correct-${qIndex}`}
                    checked={o.isCorrect}
                    onChange={(e) => updateOption(qIndex, oIndex, { isCorrect: e.target.checked })}
                    disabled={q.type === "true_false"}
                  />
                  <input
                    value={o.text}
                    onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                    placeholder={`Option ${oIndex + 1}`}
                    disabled={q.type === "true_false"}
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50"
                  />
                  {q.options.length > 2 && q.type !== "true_false" && (
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIndex, { options: q.options.filter((_, i) => i !== oIndex) })}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {q.type !== "true_false" && (
                <button
                  type="button"
                  onClick={() => updateQuestion(qIndex, { options: [...q.options, { text: "", isCorrect: false }] })}
                  className="self-start text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  + Add option
                </button>
              )}
            </div>
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
        disabled={pending || !title.trim()}
        onClick={submit}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create assessment"}
      </button>
    </div>
  );
}
