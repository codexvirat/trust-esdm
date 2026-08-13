"use client";

import { useState, useTransition } from "react";
import { closeAttendanceSessionAction, markAllPresentAction, markAttendanceManuallyAction } from "@/app/actions/attendance";
import { StatusPill } from "@/components/StatusPill";
import { ScanBadgeForm } from "./ScanBadgeForm";
import type { AttendanceRecord, AttendanceSession, UserSummary } from "@/lib/types";

export function SessionsPanel({
  projectId,
  workshopId,
  batchId,
  sessions,
  records,
  candidates,
  locked,
}: {
  projectId: string;
  workshopId: string;
  batchId: string;
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  candidates: UserSummary[];
  locked?: boolean;
}) {
  if (sessions.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No attendance sessions opened yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {sessions.map((session) => (
        <SessionRow
          key={session._id}
          projectId={projectId}
          workshopId={workshopId}
          batchId={batchId}
          session={session}
          records={records.filter((r) => r.attendanceSessionId === session._id)}
          candidates={candidates}
          locked={locked}
        />
      ))}
    </ul>
  );
}

function SessionRow({
  projectId,
  workshopId,
  batchId,
  session,
  records,
  candidates,
  locked,
}: {
  projectId: string;
  workshopId: string;
  batchId: string;
  session: AttendanceSession;
  records: AttendanceRecord[];
  candidates: UserSummary[];
  locked?: boolean;
}) {
  const [closePending, startClose] = useTransition();
  const [markPending, startMark] = useTransition();
  const [markAllPending, startMarkAll] = useTransition();
  const [showMark, setShowMark] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);

  const recordedIds = new Set(records.map((r) => r.candidateUserId));
  const unrecorded = candidates.filter((c) => !recordedIds.has(c._id));
  const candidateById = new Map(candidates.map((c) => [c._id, c]));

  const isClosed = session.status === "closed";

  const changeStatus = (candidateId: string, status: "present" | "late" | "absent") => {
    if (isClosed) {
      const name = candidateById.get(candidateId)?.fullName ?? "this candidate";
      if (!window.confirm(`Session is closed — change ${name}'s status to ${status} anyway?`)) return;
    }
    startMark(async () => {
      const error = await markAttendanceManuallyAction(projectId, workshopId, batchId, session._id, candidateId, status);
      if (error) window.alert(error);
      else setEditingCandidateId(null);
    });
  };

  return (
    <li className="py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">{session.sessionLabel}</p>
          <p className="text-xs text-slate-500">
            {new Date(session.sessionDate).toLocaleDateString()} · {records.length} of {candidates.length} recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={session.status} />
          {isClosed && !locked && <span className="text-[11px] text-slate-400">editable by admin</span>}
          {session.status === "open" && !locked && (
            <button
              type="button"
              disabled={closePending}
              onClick={() =>
                startClose(async () => {
                  const error = await closeAttendanceSessionAction(projectId, workshopId, batchId, session._id);
                  if (error) window.alert(error);
                })
              }
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {closePending ? "Closing…" : "Close"}
            </button>
          )}
        </div>
      </div>

      {records.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {records.map((r) =>
            editingCandidateId === r.candidateUserId ? (
              <span key={r._id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-2.5 pr-1 text-xs">
                {candidateById.get(r.candidateUserId)?.fullName ?? "Unknown"}
                {(["present", "late", "absent"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={markPending}
                    onClick={() => changeStatus(r.candidateUserId, status)}
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium hover:opacity-80 ${
                      status === "present" ? "bg-emerald-100 text-emerald-700" : status === "late" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {status}
                  </button>
                ))}
                <button type="button" onClick={() => setEditingCandidateId(null)} className="px-1 text-slate-400 hover:text-slate-700">
                  ✕
                </button>
              </span>
            ) : (
              <span key={r._id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {candidateById.get(r.candidateUserId)?.fullName ?? "Unknown"}
                <span className={r.status === "present" ? "text-emerald-600" : r.status === "late" ? "text-amber-600" : "text-red-600"}>· {r.status}</span>
                {!locked && (
                  <button
                    type="button"
                    onClick={() => setEditingCandidateId(r.candidateUserId)}
                    className="text-slate-400 hover:text-slate-700"
                    title="Change status"
                  >
                    ✎
                  </button>
                )}
              </span>
            ),
          )}
        </div>
      )}

      {session.status === "open" && !locked && (
        <div className="mt-2">
          <ScanBadgeForm projectId={projectId} workshopId={workshopId} batchId={batchId} sessionId={session._id} />
        </div>
      )}

      {!locked && unrecorded.length > 0 && (
        <div className="mt-2">
          {!showMark ? (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setShowMark(true)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
                No badge handy? Mark manually
              </button>
              <button
                type="button"
                disabled={markAllPending}
                onClick={() => {
                  if (!window.confirm(`Mark all ${unrecorded.length} unrecorded candidate(s) present? This only fills in missing records — anyone already marked is left untouched.`)) {
                    return;
                  }
                  startMarkAll(async () => {
                    const error = await markAllPresentAction(projectId, workshopId, batchId, session._id);
                    if (error) window.alert(error);
                  });
                }}
                className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
              >
                {markAllPending ? "Marking…" : `Mark all present (${unrecorded.length})`}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {unrecorded.map((c) => (
                <span key={c._id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-2.5 pr-1 text-xs">
                  {c.fullName}
                  {(["present", "late", "absent"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={markPending}
                      onClick={() =>
                        startMark(async () => {
                          const error = await markAttendanceManuallyAction(projectId, workshopId, batchId, session._id, c._id, status);
                          if (error) window.alert(error);
                        })
                      }
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium hover:opacity-80 ${
                        status === "present" ? "bg-emerald-100 text-emerald-700" : status === "late" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </span>
              ))}
              <button type="button" onClick={() => setShowMark(false)} className="text-xs text-slate-500 hover:text-slate-800">
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
