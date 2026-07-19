"use client";

import { useActionState, useState } from "react";
import { generateCertificatesForBatchAction, type GenerateBatchState } from "@/app/actions/certificates";
import type { CertificateTemplate } from "@/lib/types";

const initialState: GenerateBatchState = {};

export function GenerateCertificatesPanel({
  projectId,
  workshopId,
  batchId,
  templates,
}: {
  projectId: string;
  workshopId: string;
  batchId: string;
  templates: CertificateTemplate[];
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const bound = generateCertificatesForBatchAction.bind(null, projectId, workshopId, batchId);
  const [state, action, pending] = useActionState(bound, initialState);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Generate certificates for this batch</h2>
          <p className="mt-1 text-sm text-slate-500">
            Issues a certificate for every enrolled candidate who has met the attendance/assessment/feedback requirements —
            candidates who aren&apos;t eligible yet, or already have a certificate, are skipped automatically.
          </p>
        </div>
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
        <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
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
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Generating…" : "Confirm & Generate"}
          </button>
          <button type="button" onClick={() => setShowConfirm(false)} className="text-sm text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </form>
      )}

      {templates.length === 0 && <p className="mt-2 text-xs text-amber-700">Create a certificate template first.</p>}
      {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}

      {state.result && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-900">
            {state.result.issued.length} issued · {state.result.skippedIneligible.length} not yet eligible ·{" "}
            {state.result.skippedAlreadyCertified.length} already certified
            {state.result.failed.length > 0 ? ` · ${state.result.failed.length} failed` : ""}
          </p>

          {state.result.issued.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-emerald-700">
              {state.result.issued.map((r) => (
                <li key={r.enrollmentId}>
                  {r.candidateName} — {r.certificateNumber}
                </li>
              ))}
            </ul>
          )}

          {state.result.skippedIneligible.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-slate-500">
              {state.result.skippedIneligible.map((r) => (
                <li key={r.enrollmentId}>{r.candidateName} — not yet eligible</li>
              ))}
            </ul>
          )}

          {state.result.failed.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-red-700">
              {state.result.failed.map((r) => (
                <li key={r.enrollmentId}>
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
