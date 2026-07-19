import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Marquee, Project } from "@/lib/types";
import { ProjectFilter } from "@/components/ProjectFilter";
import { CreateMarqueeForm } from "./CreateMarqueeForm";
import { MarqueeRow } from "./MarqueeRow";

export default async function MarqueePage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [projects, items] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<Marquee[]>(`/marquee?projectId=${projectId}`, { accessToken }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Marquee</h1>
        <p className="mt-1 text-sm text-slate-500">The scrolling announcement bar at the top of the public site. All active items scroll together, one after another.</p>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/marquee" />

      <CreateMarqueeForm projectId={projectId} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((m) => (
              <MarqueeRow key={m._id} projectId={projectId} marquee={m} />
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No marquee items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
