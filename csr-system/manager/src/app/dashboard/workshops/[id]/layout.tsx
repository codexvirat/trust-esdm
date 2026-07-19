import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { WorkshopSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { DeleteWorkshopButton } from "./DeleteWorkshopButton";
import { WorkshopTabs } from "./WorkshopTabs";

export default async function WorkshopLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessToken } = await requireManagerRole();

  let workshop: WorkshopSummary;
  try {
    workshop = await apiFetch<WorkshopSummary>(`/workshops/${id}`, { accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/workshops" className="text-sm text-slate-500 hover:text-slate-800">
          ← Workshops
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{workshop.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{workshop.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill status={workshop.status} />
            <DeleteWorkshopButton workshopId={workshop._id} workshopTitle={workshop.title} />
          </div>
        </div>
      </div>

      <WorkshopTabs workshopId={workshop._id} />

      {children}
    </div>
  );
}
