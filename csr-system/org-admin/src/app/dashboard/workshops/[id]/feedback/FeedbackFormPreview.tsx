"use client";

import type { FeedbackForm } from "@/lib/types";

/** Read-only rendering of a feedback form exactly as a candidate would see it — no inputs are submittable. */
export function FeedbackFormPreview({ form }: { form: FeedbackForm }) {
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {form.questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-900">
            {i + 1}. {q.questionText}
            {q.required && <span className="ml-1 text-red-500">*</span>}
          </p>

          {(q.type === "rating" || q.type === "nps") && (
            <div className="mt-3 flex gap-2">
              {Array.from({ length: q.type === "nps" ? 11 : 5 }, (_, n) => n).map((n) => (
                <span key={n} className="flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-300 px-2 text-sm text-slate-400">
                  {q.type === "nps" ? n : n + 1}
                </span>
              ))}
            </div>
          )}

          {q.type === "text" && <div className="mt-3 h-16 w-full rounded-md border border-dashed border-slate-300 bg-slate-50" />}

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
                          <input type="radio" disabled className="h-4 w-4" />
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
    </div>
  );
}
