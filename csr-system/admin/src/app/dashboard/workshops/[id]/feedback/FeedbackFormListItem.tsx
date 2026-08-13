"use client";

import { useState, useTransition } from "react";
import { setFeedbackEnabledAction } from "@/app/actions/feedback";
import type { FeedbackForm, FeedbackResponse } from "@/lib/types";
import { FeedbackFormPreview } from "./FeedbackFormPreview";
import { FeedbackResponsesPanel } from "./FeedbackResponsesPanel";
import { EditFeedbackForm } from "./EditFeedbackForm";

export function FeedbackFormListItem({
  projectId,
  workshopId,
  form,
  responses,
  batchName,
}: {
  projectId: string;
  workshopId: string;
  form: FeedbackForm;
  responses: FeedbackResponse[];
  batchName?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"none" | "preview" | "edit" | "responses">("none");

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {form.title || "Feedback form"} ({form.questions.length} question{form.questions.length === 1 ? "" : "s"}){" "}
            <span className="font-normal text-slate-400">— {form.batchId ? `Batch: ${batchName ?? "unknown"}` : "whole workshop"}</span>
          </p>
          <p className="text-xs text-slate-500">
            {responses.length} response{responses.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setView((v) => (v === "responses" ? "none" : "responses"))}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {view === "responses" ? "Hide responses" : `Responses (${responses.length})`}
          </button>
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
            onClick={() => startTransition(() => setFeedbackEnabledAction(projectId, workshopId, form._id, !form.isEnabled))}
            className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-60 ${
              form.isEnabled ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {pending ? "Updating…" : form.isEnabled ? "Enabled — click to disable" : "Disabled — click to enable"}
          </button>
        </div>
      </div>

      {view === "responses" && <FeedbackResponsesPanel projectId={projectId} workshopId={workshopId} form={form} responses={responses} />}
      {view === "preview" && <FeedbackFormPreview form={form} />}
      {view === "edit" && (
        <>
          {responses.length > 0 && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              This form already has {responses.length} response{responses.length === 1 ? "" : "s"} — saving will fail because questions are locked
              once candidates have answered.
            </p>
          )}
          <EditFeedbackForm projectId={projectId} workshopId={workshopId} form={form} onDone={() => setView("none")} />
        </>
      )}
    </li>
  );
}
