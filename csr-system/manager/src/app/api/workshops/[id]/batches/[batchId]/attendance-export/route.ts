import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { AttendanceRecord, AttendanceSession, Batch, Enrollment, UserSummary } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; batchId: string }> }) {
  const { id: workshopId, batchId } = await params;
  const { accessToken } = await requireManagerRole();

  const [batch, sessions, records, enrollments, candidates] = await Promise.all([
    apiFetch<Batch>(`/workshops/${workshopId}/batches/${batchId}`, { accessToken }),
    apiFetch<AttendanceSession[]>(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions`, { accessToken }),
    apiFetch<AttendanceRecord[]>(`/attendance/records?batchId=${batchId}`, { accessToken }),
    apiFetch<Enrollment[]>(`/enrollments?batchId=${batchId}`, { accessToken }),
    apiFetch<UserSummary[]>("/users?roleCode=candidate", { accessToken }),
  ]);

  const candidateById = new Map(candidates.map((c) => [c._id, c]));
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
  const key = (candidateUserId: string, sessionId: string) => `${candidateUserId}|${sessionId}`;
  const recordByKey = new Map(records.map((r) => [key(r.candidateUserId, r.attendanceSessionId), r]));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");
  sheet.columns = [
    { header: "Candidate Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 28 },
    ...sortedSessions.map((s, i) => ({
      header: `${new Date(s.sessionDate).toLocaleDateString()} (${s.sessionLabel})`,
      key: `session_${i}`,
      width: 20,
    })),
    { header: "Attended", key: "attended", width: 10 },
    { header: "Total Sessions", key: "total", width: 14 },
    { header: "Percentage", key: "percentage", width: 12 },
  ];

  enrollments.forEach((e) => {
    const candidate = candidateById.get(e.candidateUserId);
    const row: Record<string, string | number> = {
      name: candidate?.fullName ?? "Unknown",
      email: candidate?.email ?? "",
    };
    let attended = 0;
    sortedSessions.forEach((s, i) => {
      const rec = recordByKey.get(key(e.candidateUserId, s._id));
      row[`session_${i}`] = rec ? rec.status : "—";
      if (rec && rec.status !== "absent") attended++;
    });
    row.attended = attended;
    row.total = sortedSessions.length;
    row.percentage = sortedSessions.length ? `${Math.round((attended / sortedSessions.length) * 100)}%` : "—";
    sheet.addRow(row);
  });
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-${batch.code}.xlsx"`,
    },
  });
}
