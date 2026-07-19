"use client";

import { useState, useTransition } from "react";
import { createQuestionAction } from "@/app/actions/questionBank";
import type { QuestionOption, QuestionType } from "@/lib/types";

export function CreateQuestionForm() {
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState<QuestionType>("single_choice");
  const [marks, setMarks] = useState(5);
  const [tags, setTags] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>([{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New question
      </button>
    );
  }

  function updateOption(index: number, patch: Partial<QuestionOption>) {
    setOptions((os) => os.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const result = await createQuestionAction({
        questionText,
        type,
        marks,
        options,
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
        setOptions([{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
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
          <select value={type} onChange={(e) => setType(e.target.value as QuestionType)} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
            <option value="single_choice">Single choice</option>
            <option value="multiple_choice">Multiple choice</option>
            <option value="true_false">True / False</option>
          </select>
          <input
            type="number"
            min={0}
            value={marks}
            onChange={(e) => setMarks(Number(e.target.value))}
            className="w-24 rounded-md border border-slate-300 px-2 py-2 text-sm"
            title="Marks"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2 pl-2">
          {options.map((o, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type={type === "multiple_choice" ? "checkbox" : "radio"}
                name="correct"
                checked={o.isCorrect}
                onChange={(e) =>
                  setOptions((os) => os.map((opt, i) => (i === index ? { ...opt, isCorrect: e.target.checked } : type === "multiple_choice" ? opt : { ...opt, isCorrect: false })))
                }
              />
              <input
                value={o.text}
                onChange={(e) => updateOption(index, { text: e.target.value })}
                placeholder={`Option ${index + 1}`}
                className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              {options.length > 2 && (
                <button type="button" onClick={() => setOptions((os) => os.filter((_, i) => i !== index))} className="text-xs text-slate-400 hover:text-red-600">
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptions((os) => [...os, { text: "", isCorrect: false }])}
            className="self-start text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            + Add option
          </button>
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
