import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { WorkshopCategory, Project } from "@/lib/types";
import { ProjectFilter } from "@/components/ProjectFilter";
import { CreateWorkshopCategoryForm } from "./CreateWorkshopCategoryForm";
import { WorkshopCategoryRow } from "./WorkshopCategoryRow";

export default async function WorkshopCategoriesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [projects, categories] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<WorkshopCategory[]>(`/workshop-categories?projectId=${projectId}`, { accessToken }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Workshop categories</h1>
        <p className="mt-1 text-sm text-slate-500">Group workshops for filtering and reporting.</p>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/workshop-categories" />

      <CreateWorkshopCategoryForm projectId={projectId} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <WorkshopCategoryRow key={c._id} projectId={projectId} category={c} />
          ))}
          {categories.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No categories yet.</li>}
        </ul>
      </div>
    </div>
  );
}
