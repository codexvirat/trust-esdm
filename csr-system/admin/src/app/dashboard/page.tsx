import Link from "next/link";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { Project, WorkshopSummary, Registration, UserSummary, Certificate } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { ProjectFilter } from "@/components/ProjectFilter";

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { accessToken, user } = await requireAdminRole();
  const { projectId: requestedProjectId } = await searchParams;

  const projects = await apiFetch<Project[]>("/projects", { accessToken });
  const projectId = requestedProjectId || user.projectId;

  const activeCount = projects.filter((o) => o.status === "active").length;
  const suspendedCount = projects.filter((o) => o.status === "suspended").length;

  const [workshops, pendingRegistrations, candidates, certificates] = await Promise.all([
    apiFetch<WorkshopSummary[]>(`/workshops?projectId=${projectId}`, { accessToken }),
    apiFetch<Registration[]>(`/registrations?status=pending&projectId=${projectId}`, { accessToken }),
    apiFetch<UserSummary[]>(`/users?roleCode=candidate&projectId=${projectId}`, { accessToken }),
    apiFetch<Certificate[]>(`/certificates?status=issued&projectId=${projectId}`, { accessToken }),
  ]);

  const liveWorkshops = workshops.filter((e) => e.status === "published" || e.status === "ongoing").length;
  const selectedProjectName = projects.find((o) => o._id === projectId)?.name ?? "this project";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Platform-wide overview across every tenant project.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value={projects.length} href="/dashboard/projects" />
        <StatCard label="Active" value={activeCount} accent="text-emerald-600" href="/dashboard/projects" />
        <StatCard label="Suspended" value={suspendedCount} accent="text-red-600" href="/dashboard/projects" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{selectedProjectName}</h2>
          <ProjectFilter projects={projects} selectedId={projectId} basePath="/dashboard" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Workshops" value={workshops.length} href={`/dashboard/workshops?projectId=${projectId}`} compact />
          <StatCard label="Live / published" value={liveWorkshops} href={`/dashboard/workshops?projectId=${projectId}`} compact />
          <StatCard
            label="Pending registrations"
            value={pendingRegistrations.length}
            href={`/dashboard/registrations?projectId=${projectId}`}
            highlight={pendingRegistrations.length > 0}
            compact
          />
          <StatCard label="Candidates" value={candidates.length} href={`/dashboard/candidates?projectId=${projectId}`} compact />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-1">
          <StatCard
            label="Certificates issued"
            value={certificates.length}
            href={`/dashboard/certificates?projectId=${projectId}`}
            compact
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent workshops</h2>
          <Link href={`/dashboard/workshops?projectId=${projectId}`} className="text-xs font-medium text-slate-600 hover:text-slate-900">
            View all →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {workshops.slice(0, 5).map((workshop) => (
            <li key={workshop._id} className="flex items-center justify-between py-3">
              <div>
                <Link href={`/dashboard/workshops/${workshop._id}?projectId=${projectId}`} className="text-sm font-medium text-slate-900 hover:underline">
                  {workshop.title}
                </Link>
                <p className="text-xs text-slate-500">{workshop.enrolledCount} enrolled</p>
              </div>
              <StatusPill status={workshop.status} />
            </li>
          ))}
          {workshops.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No workshops yet for this project.</li>}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent projects</h2>
          <Link href="/dashboard/projects" className="text-xs font-medium text-slate-600 hover:text-slate-900">
            View all →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {projects.slice(0, 5).map((project) => (
            <li key={project._id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{project.name}</p>
                <p className="text-xs text-slate-500">{project.slug}</p>
              </div>
              <span className="text-xs capitalize text-slate-500">{project.type.replace("_", " ")}</span>
            </li>
          ))}
          {projects.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No projects yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  accent,
  highlight,
  compact,
}: {
  label: string;
  value: number;
  href?: string;
  accent?: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  const content = (
    <div
      className={`rounded-xl border p-5 transition ${href ? "hover:shadow-sm" : ""} ${
        highlight ? "border-amber-300 bg-amber-50" : compact ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
