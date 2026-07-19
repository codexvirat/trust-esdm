"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createFeedbackFormAction } from "@/app/actions/feedback";
import type { WorkshopSummary, FeedbackBankQuestion, FeedbackFormQuestion, FeedbackQuestionType } from "@/lib/types";

function blankQuestion(): FeedbackFormQuestion {
  return { questionText: "", type: "rating", required: true };
}

export function CreateFeedbackPaperForm({
  projectId,
  workshops,
  bankQuestions,
}: {
  projectId: string;
  workshops: WorkshopSummary[];
  bankQuestions: FeedbackBankQuestion[];
}) {
  const [open, setOpen] = useState(false);
  const [workshopId, setWorkshopId] = useState("");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<FeedbackFormQuestion[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [savedForWorkshopId, setSavedForWorkshopId] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New feedback form
      </button>
    );
  }

  const totalQuestions = questions.length + selectedBankIds.length;

  function toggleBank(id: string) {
    setSelectedBankIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function update(index: number, patch: Partial<FeedbackFormQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function submit() {
    setError(undefined);
    setSavedForWorkshopId(undefined);
    if (!workshopId) {
      setError("Choose which workshop this form belongs to.");
      return;
    }
    startTransition(async () => {
      const result = await createFeedbackFormAction(projectId, workshopId, title, questions, selectedBankIds);
      if (result.error) {
        setError(result.error);
      } else {
        setSavedForWorkshopId(workshopId);
        setTitle("");
        setQuestions([]);
        setSelectedBankIds([]);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">New feedback form</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Close
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Build the whole form here, save it, then go assign it to any batch of the chosen workshop.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="fb-paper-workshop" className="text-sm font-medium text-slate-700">
            Workshop
          </label>
          <select
            id="fb-paper-workshop"
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
          <label htmlFor="fb-paper-title" className="text-sm font-medium text-slate-700">
            Form name
          </label>
          <input
            id="fb-paper-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post-workshop feedback"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Questions</h3>
          <span className="text-xs text-slate-500">{totalQuestions} question{totalQuestions === 1 ? "" : "s"}</span>
        </div>

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
            <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== index))} className="text-sm text-red-600 hover:bg-red-50 rounded-md px-2 py-2">
              Remove
            </button>
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
            <span className="text-xs text-slate-500">{selectedBankIds.length} selected</span>
          </div>
          <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {bankQuestions.map((q) => (
              <label key={q._id} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                <input type="checkbox" checked={selectedBankIds.includes(q._id)} onChange={() => toggleBank(q._id)} className="mt-0.5" />
                <span>
                  <span className="text-slate-900">{q.questionText}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {q.type} · {q.required ? "required" : "optional"}
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
        {pending ? "Saving…" : "Save form"}
      </button>
    </div>
  );
}
