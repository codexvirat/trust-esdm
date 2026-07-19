import Link from "next/link";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { WorkshopSummary, Registration, UserSummary, Certificate } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";

export default async function DashboardOverviewPage() {
  const { accessToken, user } = await requireManagerRole();

  const [workshops, pendingRegistrations, candidates, certificates] = await Promise.all([
    apiFetch<WorkshopSummary[]>("/workshops", { accessToken }),
    apiFetch<Registration[]>("/registrations?status=pending", { accessToken }),
    apiFetch<UserSummary[]>("/users?roleCode=candidate", { accessToken }),
    apiFetch<Certificate[]>("/certificates?status=issued", { accessToken }),
  ]);

  const published = workshops.filter((e) => e.status === "published" || e.status === "ongoing").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s what needs your attention.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total workshops" value={workshops.length} href="/dashboard/workshops" />
        <StatCard label="Live / published" value={published} href="/dashboard/workshops" />
        <StatCard
          label="Pending registrations"
          value={pendingRegistrations.length}
          href="/dashboard/registrations"
          highlight={pendingRegistrations.length > 0}
        />
        <StatCard label="Candidates" value={candidates.length} href="/dashboard/candidates" />
        <StatCard label="Certificates issued" value={certificates.length} href="/dashboard/certificates" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent workshops</h2>
          <Link href="/dashboard/workshops" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            View all →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {workshops.slice(0, 5).map((workshop) => (
            <li key={workshop._id} className="flex items-center justify-between py-3">
              <div>
                <Link href={`/dashboard/workshops/${workshop._id}`} className="text-sm font-medium text-slate-900 hover:underline">
                  {workshop.title}
                </Link>
                <p className="text-xs text-slate-500">{workshop.enrolledCount} enrolled</p>
              </div>
              <StatusPill status={workshop.status} />
            </li>
          ))}
          {workshops.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No workshops yet — create your first one.</li>}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-5 transition hover:shadow-sm ${highlight ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </Link>
  );
}
