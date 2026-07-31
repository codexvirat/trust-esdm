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
  const [rowsText, setRowsText] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
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
        rows:
          type === "grid"
            ? rowsText
                .split("\n")
                .map((r) => r.trim())
                .filter(Boolean)
            : undefined,
        options:
          type === "mcq"
            ? optionsText
                .split("\n")
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
        allowMultiple: type === "mcq" ? allowMultiple : undefined,
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
        setRowsText("");
        setOptionsText("");
        setAllowMultiple(false);
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
            <option value="grid">Multiple choice grid (1-5)</option>
            <option value="mcq">Multiple choice (options)</option>
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
        {type === "grid" && (
          <textarea
            value={rowsText}
            onChange={(e) => setRowsText(e.target.value)}
            placeholder={"One topic per line, e.g.\nLeadership & Business Growth\nLean Manufacturing\nQuality Management"}
            rows={4}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        )}
        {type === "mcq" && (
          <>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={"One option per line, e.g.\nStrongly agree\nAgree\nDisagree\nStrongly disagree"}
              rows={4}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-1 text-xs text-slate-600">
              <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} />
              Allow selecting multiple options (checkboxes instead of single-select)
            </label>
          </>
        )}
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
