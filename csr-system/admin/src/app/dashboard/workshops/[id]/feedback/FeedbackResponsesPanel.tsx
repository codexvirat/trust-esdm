"use client";

import { useState } from "react";
import type { FeedbackForm, FeedbackResponse, FeedbackResponseAnswer } from "@/lib/types";

function candidateLabel(candidateUserId: FeedbackResponse["candidateUserId"]) {
  if (typeof candidateUserId === "string") return "Unknown candidate";
  return candidateUserId.fullName || candidateUserId.email || "Unknown candidate";
}

function formatAnswer(question: FeedbackForm["questions"][number], answer?: FeedbackResponseAnswer) {
  if (!answer) return "No answer";
  if (question.type === "rating") return answer.ratingValue != null ? `${answer.ratingValue}/5` : "No answer";
  if (question.type === "nps") return answer.ratingValue != null ? `${answer.ratingValue}/10` : "No answer";
  if (question.type === "text") return answer.textValue?.trim() || "No answer";
  if (question.type === "grid") {
    const rows = question.rows ?? [];
    if (!answer.gridValues?.length) return "No answer";
    return rows.map((row, i) => `${row}: ${answer.gridValues?.[i] ?? "—"}`).join(", ");
  }
  if (question.type === "mcq") return answer.selectedOptions?.length ? answer.selectedOptions.join(", ") : "No answer";
  return "No answer";
}

function toCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportResponsesCsv(form: FeedbackForm, responses: FeedbackResponse[]) {
  const header = ["Candidate", "Submitted at", ...form.questions.map((q) => q.questionText)];
  const rows = responses.map((r) => [
    candidateLabel(r.candidateUserId),
    new Date(r.submittedAt).toLocaleString(),
    ...form.questions.map((q, i) => formatAnswer(q, r.answers.find((a) => a.questionIndex === i))),
  ]);

  const csv = [header, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\r\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(form.title || "feedback-responses").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function FeedbackResponsesPanel({ form, responses }: { form: FeedbackForm; responses: FeedbackResponse[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (responses.length === 0) {
    return <p className="mt-3 text-xs text-slate-400">No responses yet.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => exportResponsesCsv(form, responses)}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>
      {responses.map((r) => {
        const expanded = expandedId === r._id;
        return (
          <div key={r._id} className="rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : r._id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
            >
              <span className="text-sm font-medium text-slate-900">{candidateLabel(r.candidateUserId)}</span>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                {new Date(r.submittedAt).toLocaleString()}
                <span className="text-slate-400">{expanded ? "▲" : "▼"}</span>
              </span>
            </button>
            {expanded && (
              <dl className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3">
                {form.questions.map((q, i) => {
                  const answer = r.answers.find((a) => a.questionIndex === i);
                  return (
                    <div key={i}>
                      <dt className="text-xs font-medium text-slate-500">
                        {i + 1}. {q.questionText}
                      </dt>
                      <dd className="mt-0.5 text-sm text-slate-800">{formatAnswer(q, answer)}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </div>
        );
      })}
    </div>
  );
}
