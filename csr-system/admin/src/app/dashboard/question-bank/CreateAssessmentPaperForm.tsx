"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createAssessmentAction } from "@/app/actions/assessments";
import type { AssessmentQuestion, WorkshopSummary, Question, QuestionType } from "@/lib/types";

function blankQuestion(): AssessmentQuestion {
  return { questionText: "", type: "single_choice", marks: 5, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] };
}

export function CreateAssessmentPaperForm({
  projectId,
  workshops,
  bankQuestions,
}: {
  projectId: string;
  workshops: WorkshopSummary[];
  bankQuestions: Question[];
}) {
  const [open, setOpen] = useState(false);
  const [workshopId, setWorkshopId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingPercent, setPassingPercent] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [savedForWorkshopId, setSavedForWorkshopId] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New assessment paper
      </button>
    );
  }

  const selectedBank = bankQuestions.filter((q) => selectedBankIds.includes(q._id));
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0) + selectedBank.reduce((sum, q) => sum + q.marks, 0);
  const totalQuestions = questions.length + selectedBank.length;

  function toggleBank(id: string) {
    setSelectedBankIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
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
    setSavedForWorkshopId(undefined);
    if (!workshopId) {
      setError("Choose which workshop this paper belongs to.");
      return;
    }
    startTransition(async () => {
      const result = await createAssessmentAction(projectId, workshopId, {
        title,
        description: description || undefined,
        passingPercent,
        maxAttempts,
        durationMinutes,
        questions,
        questionBankIds: selectedBankIds,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSavedForWorkshopId(workshopId);
        setTitle("");
        setDescription("");
        setQuestions([]);
        setSelectedBankIds([]);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">New assessment paper</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Close
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Build the whole paper here, save it, then go assign it to any batch of the chosen workshop.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="paper-workshop" className="text-sm font-medium text-slate-700">
            Workshop
          </label>
          <select
            id="paper-workshop"
            value={workshopId}
            onChange={(e) => setWorkshopId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Choose a workshop…</option>
            {workshops.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="paper-title" className="text-sm font-medium text-slate-700">
            Form name
          </label>
          <input
            id="paper-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Module 1 Quiz"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="paper-description" className="text-sm font-medium text-slate-700">
            Description (optional)
          </label>
          <input
            id="paper-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="paper-passing" className="text-sm font-medium text-slate-700">
            Passing %
          </label>
          <input
            id="paper-passing"
            type="number"
            min={0}
            max={100}
            value={passingPercent}
            onChange={(e) => setPassingPercent(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="paper-attempts" className="text-sm font-medium text-slate-700">
            Max attempts
          </label>
          <input
            id="paper-attempts"
            type="number"
            min={1}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="paper-duration" className="text-sm font-medium text-slate-700">
            Duration (minutes)
          </label>
          <input
            id="paper-duration"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Questions</h3>
          <span className="text-xs text-slate-500">
            {totalQuestions} question{totalQuestions === 1 ? "" : "s"} · {totalMarks} marks
          </span>
        </div>

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
              <button
                type="button"
                onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qIndex))}
                className="rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2 pl-2">
              {q.options.map((o, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type={q.type === "multiple_choice" ? "checkbox" : "radio"}
                    name={`paper-correct-${qIndex}`}
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

      {bankQuestions.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Or pull from the question bank below</h3>
            <span className="text-xs text-slate-500">{selectedBank.length} selected</span>
          </div>
          <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {bankQuestions.map((q) => (
              <label key={q._id} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                <input type="checkbox" checked={selectedBankIds.includes(q._id)} onChange={() => toggleBank(q._id)} className="mt-0.5" />
                <span>
                  <span className="text-slate-900">{q.questionText}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {q.marks} marks · {q.difficulty}
                    {q.tags.length > 0 && ` · ${q.tags.join(", ")}`}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {savedForWorkshopId && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.{" "}
          <Link href={`/dashboard/workshops/${savedForWorkshopId}?projectId=${projectId}`} className="font-medium underline">
            Go to that workshop
          </Link>{" "}
          to assign it to a batch.
        </p>
      )}

      <button
        type="button"
        disabled={pending || !title.trim() || totalQuestions === 0 || !workshopId}
        onClick={submit}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save paper"}
      </button>
    </div>
  );
}
