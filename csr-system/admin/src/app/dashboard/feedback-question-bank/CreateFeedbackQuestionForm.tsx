"use client";

import { useState, useTransition } from "react";
import { createFeedbackQuestionAction } from "@/app/actions/feedbackQuestionBank";
import type { FeedbackQuestionType } from "@/lib/types";

export function CreateFeedbackQuestionForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState<FeedbackQuestionType>("rating");
  const [required, setRequired] = useState(true);
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New question
      </button>
    );
  }

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const result = await createFeedbackQuestionAction(projectId, {
        questionText,
        type,
        required,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setQuestionText("");
        setTags("");
        setRequired(true);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">New question</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Cancel
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <input
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Question text"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as FeedbackQuestionType)} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
            <option value="rating">Rating (0-5)</option>
            <option value="nps">NPS</option>
            <option value="text">Free text</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Required
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        disabled={pending || !questionText.trim()}
        onClick={submit}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create question"}
      </button>
    </div>
  );
}
