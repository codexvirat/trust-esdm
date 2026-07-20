"use client";

import { useEffect, useState } from "react";
import { getCandidateProfileAction } from "@/app/actions/candidates";
import { StatusPill } from "@/components/StatusPill";
import type { CandidateProfile, UserSummary } from "@/lib/types";

function formatDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export function CandidateProfileModal({
  candidateId,
  projectId,
  onClose,
}: {
  candidateId: string;
  projectId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ user: UserSummary; profile: CandidateProfile | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCandidateProfileAction(projectId, candidateId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load this candidate's profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId, projectId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Candidate profile</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {data && (
          <div className="mt-4 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-slate-900">{data.user.fullName}</p>
                <StatusPill status={data.user.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {data.user.email} {data.user.phone ? `· ${data.user.phone}` : ""}
              </p>
            </div>

            {!data.profile && <p className="text-sm text-slate-400">This candidate hasn&apos;t filled in their profile details yet.</p>}

            {data.profile && (
              <>
                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <Field label="Date of birth" value={formatDate(data.profile.dob)} />
                  <Field label="Gender" value={data.profile.gender || "—"} />
                  <Field label="Blood group" value={data.profile.bloodGroup || "—"} />
                  <Field label="Alt. phone" value={data.profile.alternatePhone || "—"} />
                </dl>

                {data.profile.address && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Address</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {[
                        data.profile.address.line1,
                        data.profile.address.line2,
                        data.profile.address.city,
                        data.profile.address.state,
                        data.profile.address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                )}

                {data.profile.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Skills</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {data.profile.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {data.profile.affiliatedOrganisation?.name && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Organisation</p>
                    <p className="mt-1 text-sm text-slate-700">{data.profile.affiliatedOrganisation.name}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}
