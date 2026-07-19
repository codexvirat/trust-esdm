import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Certificate, Enrollment, WorkshopSummary } from "@/lib/types";

interface EligibilityGate {
  met: boolean;
  [key: string]: unknown;
}

interface EligibilityResult {
  eligible: boolean;
  gates: { attendance: EligibilityGate; assessment: EligibilityGate; feedback: EligibilityGate };
}

export default async function CertificatesPage() {
  const { accessToken } = await requireCandidateRole();

  const [certificates, enrollments] = await Promise.all([
    apiFetch<Certificate[]>("/certificates", { accessToken }),
    apiFetch<Enrollment[]>("/enrollments", { accessToken }),
  ]);

  const issuedEnrollmentIds = new Set(certificates.map((c) => c.enrollmentId));
  const pendingEnrollments = enrollments.filter((e) => !issuedEnrollmentIds.has(e._id));

  const [workshops, eligibility] = await Promise.all([
    Promise.all(pendingEnrollments.map((e) => apiFetch<WorkshopSummary>(`/workshops/${e.workshopId}`, { accessToken }))),
    Promise.all(
      pendingEnrollments.map((e) => apiFetch<EligibilityResult>(`/enrollments/${e._id}/certificate/eligibility`, { accessToken })),
    ),
  ]);

  const certWorkshops = await Promise.all(certificates.map((c) => apiFetch<WorkshopSummary>(`/workshops/${c.workshopId}`, { accessToken })));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Certificates</h1>
        <p className="mt-1 text-sm text-slate-500">Issued once your attendance, assessment, and feedback gates are all met.</p>
      </div>

      <div className="flex flex-col gap-3">
        {certificates.map((cert, i) => (
          <div key={cert._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <p className="text-sm font-medium text-slate-900">{certWorkshops[i]?.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {cert.certificateNumber} · issued {new Date(cert.issueDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {cert.status === "issued" && cert.fileUrl && (
                <a
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-slate-700 underline hover:text-slate-900"
                >
                  Download PDF
                </a>
              )}
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  cert.status === "issued" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}
              >
                {cert.status === "issued" ? "Issued" : "Revoked"} · {cert.verificationCode}
              </span>
            </div>
          </div>
        ))}

        {pendingEnrollments.map((enrollment, i) => {
          const workshop = workshops[i]!;
          const gates = eligibility[i]!.gates;
          return (
            <div key={enrollment._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-900">{workshop.title}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <GateBadge label="Attendance" met={gates.attendance.met} />
                <GateBadge label="Assessment" met={gates.assessment.met} />
                <GateBadge label="Feedback" met={gates.feedback.met} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {eligibility[i]!.eligible
                  ? "All requirements met — your trainer or manager can issue your certificate."
                  : "Complete the remaining requirements above to become eligible."}
              </p>
            </div>
          );
        })}

        {certificates.length === 0 && pendingEnrollments.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No trainings yet.
          </p>
        )}
      </div>
    </div>
  );
}

function GateBadge({ label, met }: { label: string; met: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 font-medium ${met ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
      {met ? "✓" : "○"} {label}
    </span>
  );
}
