import Link from "next/link";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Batch, CandidateProfile, Enrollment, WorkshopSummary, Project, UserSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { ProjectFilter } from "@/components/ProjectFilter";
import { RegisterCandidateForm } from "./RegisterCandidateForm";
import { EnrollCandidateButton } from "./EnrollCandidateButton";
import { DeleteCandidateButton } from "./DeleteCandidateButton";

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [projects, candidates, workshops, enrollments] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<UserSummary[]>(`/users?roleCode=candidate&projectId=${projectId}`, { accessToken }),
    apiFetch<WorkshopSummary[]>(`/workshops?projectId=${projectId}`, { accessToken }),
    apiFetch<Enrollment[]>(`/enrollments?projectId=${projectId}`, { accessToken }),
  ]);

  const enrolledCandidateIds = new Set(enrollments.filter((en) => en.status !== "dropped").map((en) => en.candidateUserId));

  const batchLists = await Promise.all(workshops.map((e) => apiFetch<Batch[]>(`/workshops/${e._id}/batches?projectId=${projectId}`, { accessToken })));
  const batchesByWorkshop: Record<string, Batch[]> = {};
  workshops.forEach((e, i) => {
    batchesByWorkshop[e._id] = batchLists[i] ?? [];
  });

  const profiles = await Promise.all(
    candidates.map((c) =>
      apiFetch<{ user: UserSummary; profile: CandidateProfile | null }>(`/users/${c._id}/candidate-profile?projectId=${projectId}`, { accessToken }).catch(
        () => ({ user: c, profile: null }),
      ),
    ),
  );
  const profileByCandidateId: Record<string, CandidateProfile | null> = {};
  candidates.forEach((c, i) => {
    profileByCandidateId[c._id] = profiles[i]?.profile ?? null;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">Everyone with a candidate account, across every project.</p>
        </div>
        <Link href={`/dashboard/candidates/by-batch?projectId=${projectId}`} className="text-sm font-medium text-teal-700 hover:text-teal-900">
          View by batch →
        </Link>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/candidates" />

      <RegisterCandidateForm projectId={projectId} />

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
                    <Link href={`/dashboard/candidates/${c._id}?projectId=${projectId}`} className="hover:text-teal-700 hover:underline">
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
                    <EnrollCandidateButton
                      projectId={projectId}
                      candidateId={c._id}
                      workshops={workshops}
                      batchesByWorkshop={batchesByWorkshop}
                      isEnrolled={enrolledCandidateIds.has(c._id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <DeleteCandidateButton projectId={projectId} candidateId={c._id} candidateName={c.fullName} />
                  </td>
                </tr>
              );
            })}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No candidates yet for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
