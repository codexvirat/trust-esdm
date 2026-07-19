import { requireCandidateRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import { QrDisplay } from "./QrDisplay";
import type { AttendanceRecord, Batch, Enrollment, WorkshopSummary } from "@/lib/types";

export default async function AttendancePage() {
  const { accessToken } = await requireCandidateRole();

  const [{ attendanceQrToken }, records, enrollments] = await Promise.all([
    apiFetch<{ attendanceQrToken: string }>("/me/attendance-qr", { accessToken }),
    apiFetch<AttendanceRecord[]>("/attendance/records", { accessToken }),
    apiFetch<Enrollment[]>("/enrollments", { accessToken }),
  ]);

  const [workshops, batches] = await Promise.all([
    Promise.all(enrollments.map((e) => apiFetch<WorkshopSummary>(`/workshops/${e.workshopId}`, { accessToken }))),
    Promise.all(enrollments.map((e) => apiFetch<Batch>(`/workshops/${e.workshopId}/batches/${e.batchId}`, { accessToken }))),
  ]);

  const workshopByBatchId = new Map(enrollments.map((e, i) => [e.batchId, workshops[i]!]));
  const batchById = new Map(enrollments.map((e, i) => [e.batchId, batches[i]!]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My attendance badge</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your trainer scans this code to check you in — you never mark your own attendance.
        </p>
      </div>

      <div className="flex justify-center">
        <QrDisplay token={attendanceQrToken} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Attendance history</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {records.map((record) => {
            const batch = batchById.get(record.batchId);
            const workshop = workshopByBatchId.get(record.batchId);
            return (
              <li key={record._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{workshop?.title ?? "Training"}</p>
                  <p className="text-xs text-slate-500">
                    {batch?.name ?? ""} · {new Date(record.scanTime).toLocaleString()}
                  </p>
                </div>
                <StatusPill status={record.status} />
              </li>
            );
          })}
          {records.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-400">No attendance marked yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
