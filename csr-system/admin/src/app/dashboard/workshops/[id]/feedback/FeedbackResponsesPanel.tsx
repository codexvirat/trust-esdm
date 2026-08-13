"use client";

import { useState, useTransition } from "react";
import { setFeedbackResponseRatingAction, deleteFeedbackResponseAction, createFeedbackResponseForCandidateAction } from "@/app/actions/feedback";
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

export function FeedbackResponsesPanel({
  projectId,
  workshopId,
  form,
  responses,
  enrolledCandidates,
}: {
  projectId: string;
  workshopId: string;
  form: FeedbackForm;
  responses: FeedbackResponse[];
  enrolledCandidates: { candidateUserId: string; fullName: string; batchId: string }[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const respondedIds = new Set(
    responses.map((r) => (typeof r.candidateUserId === "string" ? r.candidateUserId : r.candidateUserId._id)),
  );
  const missingCandidates = enrolledCandidates.filter((c) => !respondedIds.has(c.candidateUserId));

  return (
    <div className="mt-3 flex flex-col gap-2">
      {responses.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => exportResponsesCsv(form, responses)}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      )}
      {responses.length === 0 && <p className="text-xs text-slate-400">No responses yet.</p>}
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2">
              <ResponseRatingEditor projectId={projectId} workshopId={workshopId} formId={form._id} response={r} />
              <DeleteResponseButton
                projectId={projectId}
                workshopId={workshopId}
                formId={form._id}
                responseId={r._id}
                candidateName={candidateLabel(r.candidateUserId)}
              />
            </div>
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

      {missingCandidates.length > 0 && (
        <div className="mt-2 rounded-lg border border-slate-200">
          <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Candidates without a response ({missingCandidates.length}) — enter a rating if you already have it (e.g. collected offline) to record it
            without the candidate submitting through the form.
          </p>
          <ul className="divide-y divide-slate-100">
            {missingCandidates.map((c) => (
              <AddResponseRow
                key={c.candidateUserId}
                projectId={projectId}
                workshopId={workshopId}
                formId={form._id}
                candidateUserId={c.candidateUserId}
                candidateName={c.fullName}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Admin-only rating override — see setFeedbackResponseRatingAction for why this exists alongside the candidate form. */
function ResponseRatingEditor({
  projectId,
  workshopId,
  formId,
  response,
}: {
  projectId: string;
  workshopId: string;
  formId: string;
  response: FeedbackResponse;
}) {
  const [courseRating, setCourseRating] = useState(response.courseRating?.toString() ?? "");
  const [trainerRating, setTrainerRating] = useState(response.trainerRating?.toString() ?? "");
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(undefined);
    setSaved(false);
    const course = courseRating === "" ? undefined : Number(courseRating);
    const trainer = trainerRating === "" ? undefined : Number(trainerRating);
    if (course === undefined && trainer === undefined) {
      setError("Enter at least one rating.");
      return;
    }
    if ((course !== undefined && (course < 0 || course > 5)) || (trainer !== undefined && (trainer < 0 || trainer > 5))) {
      setError("Ratings must be between 0 and 5.");
      return;
    }
    startTransition(async () => {
      const result = await setFeedbackResponseRatingAction(projectId, workshopId, formId, response._id, course, trainer);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-1 text-xs text-slate-500">
        Course rating
        <input
          type="number"
          min={0}
          max={5}
          step={1}
          value={courseRating}
          onChange={(e) => {
            setCourseRating(e.target.value);
            setSaved(false);
          }}
          className="w-14 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
        />
        /5
      </label>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        Trainer rating
        <input
          type="number"
          min={0}
          max={5}
          step={1}
          value={trainerRating}
          onChange={(e) => {
            setTrainerRating(e.target.value);
            setSaved(false);
          }}
          className="w-14 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
        />
        /5
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save rating"}
      </button>
      {saved && !pending && <span className="text-xs text-emerald-600">Saved</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

/** Deletes a response so the candidate can resubmit — see deleteFeedbackResponseAction for details. */
function DeleteResponseButton({
  projectId,
  workshopId,
  formId,
  responseId,
  candidateName,
}: {
  projectId: string;
  workshopId: string;
  formId: string;
  responseId: string;
  candidateName: string;
}) {
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(undefined);
    if (
      !window.confirm(
        `Delete ${candidateName}'s feedback response permanently? Their submitted answers will be lost, and they'll be able to submit fresh feedback for this form.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteFeedbackResponseAction(projectId, workshopId, formId, responseId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete response"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

/** Creates a rating-only response for a candidate who never submitted feedback at all — see createFeedbackResponseForCandidateAction. */
function AddResponseRow({
  projectId,
  workshopId,
  formId,
  candidateUserId,
  candidateName,
}: {
  projectId: string;
  workshopId: string;
  formId: string;
  candidateUserId: string;
  candidateName: string;
}) {
  const [courseRating, setCourseRating] = useState("");
  const [trainerRating, setTrainerRating] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  function add() {
    setError(undefined);
    const course = courseRating === "" ? undefined : Number(courseRating);
    const trainer = trainerRating === "" ? undefined : Number(trainerRating);
    if (course === undefined && trainer === undefined) {
      setError("Enter at least one rating.");
      return;
    }
    if ((course !== undefined && (course < 0 || course > 5)) || (trainer !== undefined && (trainer < 0 || trainer > 5))) {
      setError("Ratings must be between 0 and 5.");
      return;
    }
    startTransition(async () => {
      const result = await createFeedbackResponseForCandidateAction(projectId, workshopId, formId, candidateUserId, course, trainer);
      if (result.error) {
        setError(result.error);
        return;
      }
      setAdded(true);
    });
  }

  if (added) {
    return (
      <li className="flex items-center gap-3 px-4 py-2 text-xs text-emerald-600">
        {candidateName} — rating added
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-2">
      <span className="min-w-32 text-sm text-slate-700">{candidateName}</span>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        Course rating
        <input
          type="number"
          min={0}
          max={5}
          step={1}
          value={courseRating}
          onChange={(e) => setCourseRating(e.target.value)}
          className="w-14 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
        />
        /5
      </label>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        Trainer rating
        <input
          type="number"
          min={0}
          max={5}
          step={1}
          value={trainerRating}
          onChange={(e) => setTrainerRating(e.target.value)}
          className="w-14 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
        />
        /5
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={add}
        className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add rating"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </li>
  );
}
