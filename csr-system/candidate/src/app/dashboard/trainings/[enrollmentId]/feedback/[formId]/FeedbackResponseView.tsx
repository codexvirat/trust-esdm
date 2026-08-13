import type { FeedbackForm, FeedbackResponse } from "@/lib/types";

/** Read-only view of a candidate's own submitted answers for a feedback form. */
export function FeedbackResponseView({ form, response }: { form: FeedbackForm; response: FeedbackResponse }) {
  const answersByQuestion = new Map(response.answers.map((a) => [a.questionIndex, a]));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">Submitted on {new Date(response.submittedAt).toLocaleString()}</p>

      {(response.courseRating != null || response.trainerRating != null) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {response.courseRating != null && <p className="text-sm text-slate-700">Course rating: {response.courseRating}/5</p>}
          {response.trainerRating != null && <p className="mt-1 text-sm text-slate-700">Trainer rating: {response.trainerRating}/5</p>}
        </div>
      )}

      {form.questions.map((q, i) => {
        const a = answersByQuestion.get(i);
        return (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-900">
              {i + 1}. {q.questionText}
            </p>

            {(q.type === "rating" || q.type === "nps") && (
              <div className="mt-3 flex gap-2">
                {Array.from({ length: q.type === "nps" ? 11 : 5 }, (_, n) => n).map((n) => {
                  const value = q.type === "nps" ? n : n + 1;
                  const selected = a?.ratingValue === value;
                  return (
                    <span
                      key={value}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium ${
                        selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 text-slate-400"
                      }`}
                    >
                      {value}
                    </span>
                  );
                })}
              </div>
            )}

            {q.type === "text" && (
              <p className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {a?.textValue || <span className="text-slate-400">No answer</span>}
              </p>
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
                              checked={a?.gridValues?.[rowIndex] === n}
                              disabled
                              readOnly
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

            {q.type === "mcq" && (
              <div className="mt-3 flex flex-col gap-2">
                {(q.options ?? []).map((option, optionIndex) => {
                  const selected = (a?.selectedOptions ?? []).includes(option);
                  return (
                    <label key={optionIndex} className={`flex items-center gap-2 text-sm ${selected ? "font-medium text-slate-900" : "text-slate-500"}`}>
                      <input
                        type={q.allowMultiple ? "checkbox" : "radio"}
                        checked={selected}
                        disabled
                        readOnly
                        className="h-4 w-4 accent-teal-700"
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
