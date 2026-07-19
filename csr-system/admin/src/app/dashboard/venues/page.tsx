import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Project, Venue } from "@/lib/types";
import { ProjectFilter } from "@/components/ProjectFilter";
import { CreateVenueForm } from "./CreateVenueForm";
import { VenueRow } from "./VenueRow";

export default async function VenuesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;
  const projectId = requestedProjectId || user.projectId;

  const [projects, venues] = await Promise.all([
    apiFetch<Project[]>("/projects", { accessToken }),
    apiFetch<Venue[]>(`/venues?projectId=${projectId}`, { accessToken }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Venues</h1>
        <p className="mt-1 text-sm text-slate-500">Physical locations workshops can be held at.</p>
      </div>

      <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard/venues" />

      <CreateVenueForm projectId={projectId} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {venues.map((v) => (
              <VenueRow key={v._id} projectId={projectId} venue={v} />
            ))}
            {venues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No venues yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
