"use client";

import { useState } from "react";
import { StatusPill } from "@/components/StatusPill";
import { CandidateProfileModal } from "./CandidateProfileModal";
import type { Enrollment, UserSummary } from "@/lib/types";

export interface BatchCard {
  _id: string;
  name: string;
  code: string;
  workshopTitle: string;
}

export function BatchCandidatesBoard({
  projectId,
  batches,
  enrollmentsByBatch,
  candidateById,
}: {
  projectId: string;
  batches: BatchCard[];
  enrollmentsByBatch: Record<string, Enrollment[]>;
  candidateById: Record<string, UserSummary>;
}) {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [profileCandidateId, setProfileCandidateId] = useState<string | null>(null);

  const selectedBatch = batches.find((b) => b._id === selectedBatchId) ?? null;

  if (selectedBatch) {
    const enrollments = enrollmentsByBatch[selectedBatch._id] ?? [];
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setSelectedBatchId(null)}
          className="w-fit text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          ← Back to batches
        </button>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {selectedBatch.name} <span className="text-slate-400">({selectedBatch.code})</span>
          </h2>
          <p className="text-sm text-slate-500">
            {selectedBatch.workshopTitle} · {enrollments.length} enrolled
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {enrollments.map((e) => {
              const candidate = candidateById[e.candidateUserId];
              return (
                <li key={e._id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setProfileCandidateId(e.candidateUserId)}
                    className="text-left font-medium text-teal-700 hover:text-teal-900 hover:underline"
                  >
                    {candidate?.fullName ?? "Unknown candidate"}
                  </button>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">{candidate?.email}</span>
                    <StatusPill status={e.status} />
                  </div>
                </li>
              );
            })}
            {enrollments.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-400">No candidates enrolled in this batch yet.</li>
            )}
          </ul>
        </div>

        {profileCandidateId && (
          <CandidateProfileModal candidateId={profileCandidateId} projectId={projectId} onClose={() => setProfileCandidateId(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {batches.map((batch) => {
        const count = (enrollmentsByBatch[batch._id] ?? []).length;
        return (
          <button
            key={batch._id}
            type="button"
            onClick={() => setSelectedBatchId(batch._id)}
            className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-teal-300 hover:shadow-sm"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{batch.workshopTitle}</span>
            <span className="text-base font-semibold text-slate-900">
              {batch.name} <span className="text-slate-400">({batch.code})</span>
            </span>
            <span className="mt-1 text-sm text-slate-500">{count} enrolled</span>
          </button>
        );
      })}
      {batches.length === 0 && <p className="col-span-full text-center text-sm text-slate-400">No batches yet for this project.</p>}
    </div>
  );
}
