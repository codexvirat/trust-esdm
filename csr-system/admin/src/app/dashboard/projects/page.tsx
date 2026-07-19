import Link from "next/link";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Project } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { CreateProjectForm } from "./CreateProjectForm";

export default async function ProjectsPage() {
  const { accessToken } = await requireAdminRole();
  const projects = await apiFetch<Project[]>("/projects", { accessToken });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">Every tenant on the platform.</p>
      </div>

      <CreateProjectForm />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr key={project._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/dashboard/projects/${project._id}`} className="hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{project.slug}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{project.type.replace("_", " ")}</td>
                <td className="px-4 py-3 text-slate-600">{project.contactEmail}</td>
                <td className="px-4 py-3">
                  <StatusPill status={project.status} />
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
