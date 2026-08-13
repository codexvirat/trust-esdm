"use client";

import { useState, useTransition } from "react";
import { setFeedbackEnabledAction, setFeedbackResponseRatingAction } from "@/app/actions/feedback";
import type { FeedbackForm, FeedbackResponse } from "@/lib/types";
import { FeedbackFormPreview } from "./FeedbackFormPreview";
import { EditFeedbackForm } from "./EditFeedbackForm";

function candidateLabel(candidateUserId: FeedbackResponse["candidateUserId"]): string {
  return typeof candidateUserId === "string" ? candidateUserId : candidateUserId.fullName;
}

export function FeedbackFormListItem({ workshopId, form, responses }: { workshopId: string; form: FeedbackForm; responses: FeedbackResponse[] }) {
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"none" | "preview" | "edit" | "ratings">("none");

  const missingRatingCount = responses.filter((r) => r.courseRating == null || r.trainerRating == null).length;
  const avgCourseRating =
    responses.length > 0
      ? (responses.reduce((sum, r) => sum + (r.courseRating ?? 0), 0) / responses.filter((r) => r.courseRating != null).length || 0).toFixed(1)
      : null;

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">Feedback form ({form.questions.length} questions)</p>
          <p className="text-xs text-slate-500">
            {responses.length} response{responses.length === 1 ? "" : "s"}
            {avgCourseRating && ` · avg course rating ${avgCourseRating}/5`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {missingRatingCount > 0 && (
            <button
              type="button"
              onClick={() => setView((v) => (v === "ratings" ? "none" : "ratings"))}
              className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              {view === "ratings" ? "Hide ratings" : `Fix missing ratings (${missingRatingCount})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => setView((v) => (v === "preview" ? "none" : "preview"))}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {view === "preview" ? "Hide preview" : "Preview"}
          </button>
          <button
            type="button"
            onClick={() => setView((v) => (v === "edit" ? "none" : "edit"))}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {view === "edit" ? "Cancel edit" : "Edit"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setFeedbackEnabledAction(workshopId, form._id, !form.isEnabled))}
            className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-60 ${
              form.isEnabled ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {pending ? "Updating…" : form.isEnabled ? "Enabled — click to disable" : "Disabled — click to enable"}
          </button>
        </div>
      </div>

      {responses.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {responses.slice(0, 5).map((r) => (
            <li key={r._id} className="text-xs text-slate-500">
              {r.courseRating != null && `Course: ${r.courseRating}/5`}
              {r.trainerRating != null && ` · Trainer: ${r.trainerRating}/5`}
              {r.comments && ` — "${r.comments}"`}
            </li>
          ))}
        </ul>
      )}

      {view === "preview" && <FeedbackFormPreview form={form} />}
      {view === "edit" && (
        <>
          {responses.length > 0 && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              This form already has {responses.length} response{responses.length === 1 ? "" : "s"} — saving will fail because questions are locked
              once candidates have answered.
            </p>
          )}
          <EditFeedbackForm workshopId={workshopId} form={form} onDone={() => setView("none")} />
        </>
      )}
      {view === "ratings" && (
        <div className="mt-3 rounded-lg border border-slate-200">
          <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Only for responses submitted before rating collection existed — enter the candidate's actual course/trainer rating if you already have it
            (e.g. collected offline). This doesn't touch their other answers.
          </p>
          <ul className="divide-y divide-slate-100">
            {responses.map((r) => (
              <ResponseRatingRow key={r._id} workshopId={workshopId} formId={form._id} response={r} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function ResponseRatingRow({ workshopId, formId, response }: { workshopId: string; formId: string; response: FeedbackResponse }) {
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
      const result = await setFeedbackResponseRatingAction(workshopId, formId, response._id, course, trainer);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2">
      <span className="min-w-32 text-sm text-slate-700">{candidateLabel(response.candidateUserId)}</span>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        Course
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
      </label>
      <label className="flex items-center gap-1 text-xs text-slate-500">
        Trainer
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
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {saved && !pending && <span className="text-xs text-emerald-600">Saved</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </li>
  );
}
