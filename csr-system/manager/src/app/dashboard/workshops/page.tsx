import Link from "next/link";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import type { WorkshopSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { CreateWorkshopForm } from "./CreateWorkshopForm";

export default async function WorkshopsPage() {
  const { accessToken } = await requireManagerRole();
  const workshops = await apiFetch<WorkshopSummary[]>("/workshops", { accessToken });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Workshops</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage training workshops for your project.</p>
        </div>
      </div>

      <CreateWorkshopForm />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workshops.map((workshop) => (
              <tr key={workshop._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/workshops/${workshop._id}`} className="font-medium text-slate-900 hover:underline">
                    {workshop.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {workshop.type} · {workshop.mode}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {workshop.enrolledCount}
                  {workshop.capacity ? ` / ${workshop.capacity}` : ""}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={workshop.status} />
                </td>
              </tr>
            ))}
            {workshops.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No workshops yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
