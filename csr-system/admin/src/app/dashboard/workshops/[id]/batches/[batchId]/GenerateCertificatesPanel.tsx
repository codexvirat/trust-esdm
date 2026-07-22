"use client";

import { useActionState, useRef, useState } from "react";
import {
  generateCertificatesForBatchAction,
  publishCertificatesForBatchAction,
  discardDraftCertificatesForBatchAction,
  type GenerateBatchState,
  type PublishBatchState,
  type DiscardDraftsState,
} from "@/app/actions/certificates";
import type { CertificateTemplate } from "@/lib/types";

const initialGenerateState: GenerateBatchState = {};
const initialPublishState: PublishBatchState = {};
const initialDiscardState: DiscardDraftsState = {};

export function GenerateCertificatesPanel({
  projectId,
  workshopId,
  batchId,
  templates,
  draftCount,
}: {
  projectId: string;
  workshopId: string;
  batchId: string;
  templates: CertificateTemplate[];
  draftCount: number;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const discardFormRef = useRef<HTMLFormElement>(null);
  const boundGenerate = generateCertificatesForBatchAction.bind(null, projectId, workshopId, batchId);
  const [generateState, generateAction, generatePending] = useActionState(boundGenerate, initialGenerateState);

  const boundPublish = publishCertificatesForBatchAction.bind(null, projectId, workshopId, batchId);
  const [publishState, publishAction, publishPending] = useActionState(boundPublish, initialPublishState);

  const boundDiscard = discardDraftCertificatesForBatchAction.bind(null, projectId, workshopId, batchId);
  const [discardState, discardAction, discardPending] = useActionState(boundDiscard, initialDiscardState);

  // draftCount comes fresh from the server on every render — each action below calls
  // revalidatePath, which makes Next.js refetch this page's data automatically, so there's no
  // need (and no safe way, without risking double-counting) to adjust it with client-side deltas.
  const pendingDraftCount = draftCount;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Generate certificates for this batch</h2>
          <p className="mt-1 text-sm text-slate-500">
            Renders a certificate as a draft for every enrolled candidate who has met the attendance/assessment/feedback
            requirements — candidates who aren&apos;t eligible yet, or already have a certificate, are skipped automatically.
            Drafts are saved for you to download and review, and are <strong>not</strong> emailed or shown on candidate
            dashboards until you publish them below.
          </p>
        </div>
        <a
          href={`/api/workshops/${workshopId}/batches/${batchId}/certificates-zip?projectId=${projectId}`}
          className="shrink-0 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          Download All (ZIP) ↓
        </a>
      </div>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={templates.length === 0}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          Generate Certificates for Batch
        </button>
      ) : (
        <form action={generateAction} className="mt-4 flex flex-wrap items-center gap-3">
          <select name="templateId" required className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Choose a template…</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={generatePending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {generatePending ? "Generating…" : "Confirm & Generate"}
          </button>
          <button type="button" onClick={() => setShowConfirm(false)} className="text-sm text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </form>
      )}

      {templates.length === 0 && <p className="mt-2 text-xs text-amber-700">Create a certificate template first.</p>}
      {generateState.error && <p className="mt-3 text-sm text-red-700">{generateState.error}</p>}

      {generateState.result && !discardState.result && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-900">
            {generateState.result.drafted.length} drafted · {generateState.result.skippedIneligible.length} not yet eligible ·{" "}
            {generateState.result.skippedAlreadyCertified.length} already certified
            {generateState.result.failed.length > 0 ? ` · ${generateState.result.failed.length} failed` : ""}
          </p>

          {generateState.result.drafted.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-emerald-700">
              {generateState.result.drafted.map((r) => (
                <li key={r.enrollmentId}>
                  {r.candidateName} — {r.certificateNumber}
                </li>
              ))}
            </ul>
          )}

          {generateState.result.skippedIneligible.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-slate-500">
              {generateState.result.skippedIneligible.map((r) => (
                <li key={r.enrollmentId}>{r.candidateName} — not yet eligible</li>
              ))}
            </ul>
          )}

          {generateState.result.failed.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-red-700">
              {generateState.result.failed.map((r) => (
                <li key={r.enrollmentId}>
                  {r.candidateName} — {r.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pendingDraftCount > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-amber-800">
              <strong>{pendingDraftCount}</strong> draft certificate{pendingDraftCount === 1 ? "" : "s"} waiting to be published —
              review the downloaded PDFs. If they look wrong, discard and regenerate instead of publishing.
            </p>
            <div className="flex shrink-0 gap-2">
              <form ref={discardFormRef} action={discardAction}>
                <button
                  type="button"
                  disabled={discardPending}
                  onClick={() => {
                    if (window.confirm(`Delete ${pendingDraftCount} draft certificate${pendingDraftCount === 1 ? "" : "s"}? This can't be undone — you'll need to generate again.`)) {
                      discardFormRef.current?.requestSubmit();
                    }
                  }}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  {discardPending ? "Discarding…" : "Discard Drafts…"}
                </button>
              </form>
              <form action={publishAction}>
                <button
                  type="submit"
                  disabled={publishPending}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {publishPending ? "Publishing…" : "Publish & Notify Candidates"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {discardState.error && <p className="mt-3 text-sm text-red-700">{discardState.error}</p>}
      {discardState.result && (
        <p className="mt-3 text-sm text-slate-600">
          Discarded {discardState.result.discarded} draft{discardState.result.discarded === 1 ? "" : "s"} — generate again above.
        </p>
      )}

      {publishState.error && <p className="mt-3 text-sm text-red-700">{publishState.error}</p>}

      {publishState.result && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-900">
            {publishState.result.published.length} published
            {publishState.result.failed.length > 0 ? ` · ${publishState.result.failed.length} failed` : ""}
          </p>
          {publishState.result.published.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-emerald-700">
              {publishState.result.published.map((r) => (
                <li key={r.certificateId}>
                  {r.candidateName} — {r.certificateNumber} {r.emailDelivered ? "(emailed)" : "(email not delivered)"}
                </li>
              ))}
            </ul>
          )}
          {publishState.result.failed.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-red-700">
              {publishState.result.failed.map((r) => (
                <li key={r.certificateId}>
                  {r.candidateName} — {r.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
