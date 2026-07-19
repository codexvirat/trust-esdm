"use client";

import { useActionState, useState } from "react";
import { issueCertificateAction, type FormState } from "@/app/actions/certificates";
import { StatusPill } from "@/components/StatusPill";
import type { CertificateEligibility, CertificateTemplate, Enrollment, UserSummary } from "@/lib/types";

const initialState: FormState = {};

export function CandidateRow({
  projectId,
  enrollment,
  candidate,
  eligibility,
  templates,
  hasCertificate,
  revalidatePathTarget,
}: {
  projectId: string;
  enrollment: Enrollment;
  candidate?: UserSummary;
  eligibility: CertificateEligibility;
  templates: CertificateTemplate[];
  hasCertificate: boolean;
  revalidatePathTarget: string;
}) {
  const [showIssue, setShowIssue] = useState(false);
  const bound = issueCertificateAction.bind(null, projectId, enrollment._id, revalidatePathTarget);
  const [state, action, pending] = useActionState(bound, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{candidate?.fullName ?? "Unknown candidate"}</p>
          <p className="text-xs text-slate-500">{candidate?.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span>
            Attendance <b className="text-slate-900">{enrollment.attendancePercent}%</b>
          </span>
          <span>
            Assessment <span className="capitalize">{enrollment.assessmentStatus.replace("_", " ")}</span>
          </span>
          <span>Feedback {enrollment.feedbackSubmitted ? "✓" : "—"}</span>
          <StatusPill status={enrollment.status} />
        </div>
      </div>

      <div className="mt-2">
        {hasCertificate ? (
          <p className="text-xs text-emerald-700">Certificate issued.</p>
        ) : !eligibility.eligible ? (
          <p className="text-xs text-slate-400">
            Not yet eligible —{" "}
            {[
              !eligibility.gates.attendance.met && `attendance ${eligibility.gates.attendance.actual}%/${eligibility.gates.attendance.required}%`,
              !eligibility.gates.assessment.met && "assessment not passed",
              !eligibility.gates.feedback.met && "feedback not submitted",
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        ) : !showIssue ? (
          <button type="button" onClick={() => setShowIssue(true)} className="text-xs font-medium text-slate-700 underline hover:text-slate-900">
            Eligible — issue certificate
          </button>
        ) : (
          <form action={action} className="flex flex-wrap items-center gap-2">
            <select name="templateId" required className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              <option value="">Choose a template…</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending || templates.length === 0}
              className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pending ? "Issuing…" : "Issue"}
            </button>
            <button type="button" onClick={() => setShowIssue(false)} className="text-xs text-slate-500 hover:text-slate-800">
              Cancel
            </button>
            {state.error && <p className="w-full text-xs text-red-700">{state.error}</p>}
            {templates.length === 0 && <p className="w-full text-xs text-amber-700">Create a certificate template first.</p>}
          </form>
        )}
      </div>
    </li>
  );
}
