import Link from "next/link";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Batch, CandidateProfile, WorkshopSummary, UserSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { RegisterCandidateForm } from "./RegisterCandidateForm";
import { EnrollCandidateButton } from "./EnrollCandidateButton";
import { DeleteCandidateButton } from "./DeleteCandidateButton";

export default async function CandidatesPage() {
  const { accessToken } = await requireManagerRole();

  const [candidates, workshops] = await Promise.all([
    apiFetch<UserSummary[]>("/users?roleCode=candidate", { accessToken }),
    apiFetch<WorkshopSummary[]>("/workshops", { accessToken }),
  ]);

  const batchLists = await Promise.all(workshops.map((e) => apiFetch<Batch[]>(`/workshops/${e._id}/batches`, { accessToken })));
  const batchesByWorkshop: Record<string, Batch[]> = {};
  workshops.forEach((e, i) => {
    batchesByWorkshop[e._id] = batchLists[i] ?? [];
  });

  const profiles = await Promise.all(
    candidates.map((c) =>
      apiFetch<{ user: UserSummary; profile: CandidateProfile | null }>(`/users/${c._id}/candidate-profile`, { accessToken }).catch(() => ({
        user: c,
        profile: null,
      })),
    ),
  );
  const profileByCandidateId: Record<string, CandidateProfile | null> = {};
  candidates.forEach((c, i) => {
    profileByCandidateId[c._id] = profiles[i]?.profile ?? null;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Candidates</h1>
        <p className="mt-1 text-sm text-slate-500">Everyone with a candidate account in your project.</p>
      </div>

      <RegisterCandidateForm />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Enroll into a batch</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((c) => {
              const profile = profileByCandidateId[c._id];
              return (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/dashboard/candidates/${c._id}`} className="hover:text-teal-700 hover:underline">
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.email}</td>
                  <td className="px-4 py-3 text-slate-600">{profile?.affiliatedOrganisation?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {profile?.address?.city || "—"}
                    {profile?.address?.state ? `, ${profile.address.state}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <EnrollCandidateButton candidateId={c._id} workshops={workshops} batchesByWorkshop={batchesByWorkshop} />
                  </td>
                  <td className="px-4 py-3">
                    <DeleteCandidateButton candidateId={c._id} candidateName={c.fullName} />
                  </td>
                </tr>
              );
            })}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No candidates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
