import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Project, UserSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { EditProjectForm } from "./EditProjectForm";
import { ProjectStatusControls } from "./ProjectStatusControls";
import { AddStaffForm } from "./AddStaffForm";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { UserRow } from "@/components/UserRow";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessToken } = await requireAdminRole();

  let project: Project;
  let users: UserSummary[];
  try {
    [project, users] = await Promise.all([
      apiFetch<Project>(`/projects/${id}`, { accessToken }),
      apiFetch<UserSummary[]>(`/users?projectId=${id}`, { accessToken }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const byRole = {
    admin: users.filter((u) => u.roleCode === "admin"),
    manager: users.filter((u) => u.roleCode === "manager"),
    workshop_manager: users.filter((u) => u.roleCode === "workshop_manager"),
    trainer: users.filter((u) => u.roleCode === "trainer"),
    candidate: users.filter((u) => u.roleCode === "candidate"),
    super_admin: users.filter((u) => u.roleCode === "super_admin"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/projects" className="text-sm text-slate-500 hover:text-slate-800">
          ← Projects
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
          <StatusPill status={project.status} />
        </div>
        <p className="mt-1 text-sm font-mono text-xs text-slate-500">{project.slug}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Project details</h2>
        <div className="mt-4">
          <EditProjectForm project={project} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Status</h2>
        <p className="mt-1 text-xs text-slate-500">Suspending a project blocks login for every user in it.</p>
        <div className="mt-4">
          <ProjectStatusControls projectId={project._id} currentStatus={project.status} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Staff & users</h2>
            <p className="mt-1 text-xs text-slate-500">
              {byRole.admin.length} admin{byRole.admin.length === 1 ? "" : "s"} · {byRole.manager.length} manager
              {byRole.manager.length === 1 ? "" : "s"} · {byRole.workshop_manager.length} workshop manager
              {byRole.workshop_manager.length === 1 ? "" : "s"} · {byRole.trainer.length} trainer
              {byRole.trainer.length === 1 ? "" : "s"} · {byRole.candidate.length} candidate{byRole.candidate.length === 1 ? "" : "s"}
            </p>
          </div>
          <AddStaffForm projectId={project._id} />
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {users.map((u) => (
            <UserRow key={u._id} user={u} redirectPath={`/dashboard/projects/${project._id}`} />
          ))}
          {users.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No users in this project yet.</li>}
        </ul>
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-base font-semibold text-red-700">Danger zone</h2>
        <p className="mt-1 text-xs text-slate-500">
          Removes this project entirely — it disappears from every list and its users lose access. Existing records are kept for audit purposes but are no longer reachable.
        </p>
        <div className="mt-4">
          <DeleteProjectButton projectId={project._id} projectName={project.name} />
        </div>
      </div>
    </div>
  );
}
