import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Certificate, WorkshopSummary, Project, UserSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { ProjectFilter } from "@/components/ProjectFilter";
import { RevokeButton } from "./RevokeButton";

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [projects, certificates, candidates, workshops] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<Certificate[]>(`/certificates?projectId=${projectId}`, { accessToken }),
    apiFetch<UserSummary[]>(`/users?roleCode=candidate&projectId=${projectId}`, { accessToken }),
    apiFetch<WorkshopSummary[]>(`/workshops?projectId=${projectId}`, { accessToken }),
  ]);

  const candidateById = new Map(candidates.map((c) => [c._id, c]));
  const workshopById = new Map(workshops.map((e) => [e._id, e]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Certificates</h1>
        <p className="mt-1 text-sm text-slate-500">Issued from a candidate&apos;s enrollment once attendance, assessment, and feedback gates are met.</p>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/certificates" />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Certificate #</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Workshop</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {certificates.map((cert) => (
              <tr key={cert._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{cert.certificateNumber}</td>
                <td className="px-4 py-3">{candidateById.get(cert.candidateUserId)?.fullName ?? "Unknown"}</td>
                <td className="px-4 py-3">{workshopById.get(cert.workshopId)?.title ?? "Unknown"}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(cert.issueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <StatusPill status={cert.status} />
                </td>
                <td className="px-4 py-3">{cert.status === "issued" && <RevokeButton projectId={projectId} certificateId={cert._id} />}</td>
              </tr>
            ))}
            {certificates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No certificates issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
