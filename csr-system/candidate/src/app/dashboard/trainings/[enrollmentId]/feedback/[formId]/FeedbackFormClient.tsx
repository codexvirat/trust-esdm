"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitFeedbackAction } from "@/app/actions/feedback";
import type { FeedbackForm } from "@/lib/types";

type AnswerState = Record<number, { ratingValue?: number; textValue?: string; gridValues?: number[] }>;

export function FeedbackFormClient({
  workshopId,
  formId,
  enrollmentId,
  form,
}: {
  workshopId: string;
  formId: string;
  enrollmentId: string;
  form: FeedbackForm;
}) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setRating(index: number, value: number) {
    setAnswers((prev) => ({ ...prev, [index]: { ...prev[index], ratingValue: value } }));
  }

  function setText(index: number, value: string) {
    setAnswers((prev) => ({ ...prev, [index]: { ...prev[index], textValue: value } }));
  }

  function setGridValue(index: number, rowIndex: number, value: number) {
    setAnswers((prev) => {
      const gridValues = [...(prev[index]?.gridValues ?? [])];
      gridValues[rowIndex] = value;
      return { ...prev, [index]: { ...prev[index], gridValues } };
    });
  }

  function submit() {
    setError(undefined);

    const missing = form.questions.find((q, i) => {
      if (!q.required) return false;
      const a = answers[i];
      if (q.type === "text") return !a?.textValue?.trim();
      if (q.type === "grid") return (q.rows ?? []).some((_, rowIndex) => a?.gridValues?.[rowIndex] === undefined);
      return a?.ratingValue === undefined;
    });
    if (missing) {
      setError("Please answer all required questions.");
      return;
    }

    const payload = {
      answers: Object.entries(answers).map(([questionIndex, a]) => ({
        questionIndex: Number(questionIndex),
        ratingValue: a.ratingValue,
        textValue: a.textValue,
        gridValues: a.gridValues,
      })),
    };

    startTransition(async () => {
      const result = await submitFeedbackAction(workshopId, formId, enrollmentId, payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/trainings/${enrollmentId}/feedback`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {form.questions.map((q, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-900">
            {i + 1}. {q.questionText}
            {q.required && <span className="ml-1 text-red-500">*</span>}
          </p>

          {(q.type === "rating" || q.type === "nps") && (
            <div className="mt-3 flex gap-2">
              {Array.from({ length: q.type === "nps" ? 11 : 5 }, (_, n) => n).map((n) => {
                const value = q.type === "nps" ? n : n + 1;
                const selected = answers[i]?.ratingValue === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(i, value)}
                    className={`h-9 min-w-9 rounded-md border px-2 text-sm font-medium ${
                      selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "text" && (
            <textarea
              value={answers[i]?.textValue ?? ""}
              onChange={(e) => setText(i, e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          )}

          {q.type === "grid" && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-slate-500"></th>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <th key={n} className="px-2 pb-1 text-center text-xs font-medium text-slate-500">
                        {n}
                        {n === 1 && <div className="font-normal text-slate-400">Poor</div>}
                        {n === 5 && <div className="font-normal text-slate-400">Excellent</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(q.rows ?? []).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-slate-100">
                      <td className="py-2 pr-3 text-slate-700">{row}</td>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <td key={n} className="px-2 text-center">
                          <input
                            type="radio"
                            name={`grid-${i}-${rowIndex}`}
                            checked={answers[i]?.gridValues?.[rowIndex] === n}
                            onChange={() => setGridValue(i, rowIndex, n)}
                            className="h-4 w-4 accent-teal-700"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit feedback"}
        </button>
      </div>
    </div>
  );
}
