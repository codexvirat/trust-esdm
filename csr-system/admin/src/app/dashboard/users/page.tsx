import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Project, UserSummary } from "@/lib/types";
import { UserRow } from "@/components/UserRow";
import { ProjectFilter } from "./ProjectFilter";
import { AddStaffForm } from "../projects/[id]/AddStaffForm";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { projectId: requestedProjectId } = await searchParams;
  const { accessToken, user } = await requireAdminRole();

  const projects = await apiFetch<Project[]>("/projects", { accessToken });
  const projectId = requestedProjectId || user.projectId;

  const allUsers = await apiFetch<UserSummary[]>(`/users?projectId=${projectId}`, { accessToken });
  // Candidates have their own dedicated page (Candidates) — this page is for staff accounts only.
  const users = allUsers.filter((u) => u.roleCode !== "candidate");
  const activeProject = projects.find((o) => o._id === projectId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Browse accounts by project.</p>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{activeProject?.name ?? "Users"}</h2>
          {projectId && <AddStaffForm projectId={projectId} />}
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {users.map((u) => (
            <UserRow key={u._id} user={u} redirectPath="/dashboard/users" />
          ))}
          {users.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No staff accounts in this project yet.</li>}
        </ul>
      </div>
    </div>
  );
}
