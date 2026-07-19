import Link from "next/link";
import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import type { Batch, Enrollment, WorkshopSummary } from "@/lib/types";

export default async function TrainingDetailPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await params;
  const { accessToken } = await requireCandidateRole();

  const enrollment = await apiFetch<Enrollment>(`/enrollments/${enrollmentId}`, { accessToken });
  const [workshop, batch] = await Promise.all([
    apiFetch<WorkshopSummary>(`/workshops/${enrollment.workshopId}`, { accessToken }),
    apiFetch<Batch>(`/workshops/${enrollment.workshopId}/batches/${enrollment.batchId}`, { accessToken }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">{batch.name} · {batch.code}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{workshop.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{workshop.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatusPill status={enrollment.status} />
          <span className="text-xs text-slate-500">
            {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Attendance</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{enrollment.attendancePercent}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Assessment</p>
          <p className="mt-1 text-lg font-semibold capitalize text-slate-900">{enrollment.assessmentStatus.replace("_", " ")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Feedback</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{enrollment.feedbackSubmitted ? "Submitted" : "Pending"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={`/dashboard/trainings/${enrollmentId}/assessments`}
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
        >
          <p className="text-sm font-medium text-slate-900">📝 Assessments</p>
          <p className="mt-1 text-xs text-slate-500">Attempt quizzes for this training.</p>
        </Link>
        <Link
          href={`/dashboard/trainings/${enrollmentId}/feedback`}
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
        >
          <p className="text-sm font-medium text-slate-900">💬 Feedback</p>
          <p className="mt-1 text-xs text-slate-500">Share your experience with this training.</p>
        </Link>
        <Link href="/dashboard/certificates" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm">
          <p className="text-sm font-medium text-slate-900">🎓 Certificate</p>
          <p className="mt-1 text-xs text-slate-500">Check eligibility and download once issued.</p>
        </Link>
      </div>
    </div>
  );
}
