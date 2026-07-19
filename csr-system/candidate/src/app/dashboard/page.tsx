import Link from "next/link";
import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import type { Enrollment, WorkshopSummary, Batch } from "@/lib/types";

export default async function DashboardOverviewPage() {
  const { accessToken, user } = await requireCandidateRole();

  const enrollments = await apiFetch<Enrollment[]>("/enrollments", { accessToken });

  const [workshops, batches] = await Promise.all([
    Promise.all(enrollments.map((e) => apiFetch<WorkshopSummary>(`/workshops/${e.workshopId}`, { accessToken }))),
    Promise.all(enrollments.map((e) => apiFetch<Batch>(`/workshops/${e.workshopId}/batches/${e.batchId}`, { accessToken }))),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s your training at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/dashboard/attendance" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm">
          <p className="text-sm font-medium text-slate-900">📱 My attendance badge</p>
          <p className="mt-1 text-xs text-slate-500">Show this QR to your trainer to check in.</p>
        </Link>
        <Link href="/dashboard/profile" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm">
          <p className="text-sm font-medium text-slate-900">👤 Complete your profile</p>
          <p className="mt-1 text-xs text-slate-500">Education, skills, and emergency contact.</p>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">My trainings</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {enrollments.map((enrollment, i) => {
            const workshop = workshops[i]!;
            const batch = batches[i]!;
            return (
              <li key={enrollment._id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/trainings/${enrollment._id}`} className="text-sm font-medium text-slate-900 hover:underline">
                      {workshop.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {batch.name} · {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={enrollment.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                  <span>
                    Attendance <b className="text-slate-900">{enrollment.attendancePercent}%</b>
                  </span>
                  <span>
                    Assessment <span className="capitalize">{enrollment.assessmentStatus.replace("_", " ")}</span>
                  </span>
                  <span>Feedback {enrollment.feedbackSubmitted ? "✓ submitted" : "not submitted"}</span>
                </div>
              </li>
            );
          })}
          {enrollments.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-400">You&apos;re not enrolled in any training yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
