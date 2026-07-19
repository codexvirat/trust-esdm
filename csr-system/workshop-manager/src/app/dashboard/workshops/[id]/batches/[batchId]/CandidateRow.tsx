import { StatusPill } from "@/components/StatusPill";
import type { CertificateEligibility, Enrollment, UserSummary } from "@/lib/types";

export function CandidateRow({
  enrollment,
  candidate,
  eligibility,
  hasCertificate,
}: {
  enrollment: Enrollment;
  candidate?: UserSummary;
  eligibility: CertificateEligibility;
  hasCertificate: boolean;
}) {
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
        ) : (
          <p className="text-xs text-slate-500">Eligible for certificate — issued by a Manager or Admin.</p>
        )}
      </div>
    </li>
  );
}
