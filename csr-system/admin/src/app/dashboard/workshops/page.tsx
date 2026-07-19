import Link from "next/link";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { WorkshopSummary, Project } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { ProjectFilter } from "@/components/ProjectFilter";
import { CreateWorkshopForm } from "./CreateWorkshopForm";

export default async function WorkshopsPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { projectId: requestedProjectId } = await searchParams;
  const { accessToken, user } = await requireAdminRole();
  const projectId = requestedProjectId || user.projectId;

  const [projects, workshops] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<WorkshopSummary[]>(`/workshops?projectId=${projectId}`, { accessToken }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Workshops</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage training workshops across every project.</p>
        </div>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/workshops" />

      <CreateWorkshopForm projectId={projectId} />

      {workshops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          No workshops yet for this project.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop) => (
            <Link
              key={workshop._id}
              href={`/dashboard/workshops/${workshop._id}?projectId=${projectId}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{workshop.title}</h2>
                <StatusPill status={workshop.status} />
              </div>

              <p className="text-xs capitalize text-slate-500">
                {workshop.type.replace("_", " ")} · {workshop.mode}
              </p>

              <div className="mt-auto flex items-center justify-end border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {workshop.enrolledCount}
                  {workshop.capacity ? ` / ${workshop.capacity}` : ""} enrolled
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
