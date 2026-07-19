import Link from "next/link";
import type { WorkshopSummary } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { DeleteWorkshopButton } from "./DeleteWorkshopButton";
import { WorkshopTabs } from "./WorkshopTabs";

const NEXT_STATUS: Record<string, { label: string; status: WorkshopSummary["status"] }[]> = {
  draft: [{ label: "Publish", status: "published" }],
  published: [
    { label: "Mark ongoing", status: "ongoing" },
    { label: "Revert to draft", status: "draft" },
    { label: "Cancel", status: "cancelled" },
  ],
  ongoing: [
    { label: "Mark completed", status: "completed" },
    { label: "Revert to published", status: "published" },
    { label: "Cancel", status: "cancelled" },
  ],
  completed: [{ label: "Reopen (mark ongoing)", status: "ongoing" }],
  cancelled: [{ label: "Reactivate (mark published)", status: "published" }],
};

export function nextStatusActions(status: WorkshopSummary["status"]) {
  return NEXT_STATUS[status] ?? [];
}

export function WorkshopHeader({ workshop, projectId }: { workshop: WorkshopSummary; projectId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href={`/dashboard/workshops?projectId=${projectId}`} className="text-sm text-slate-500 hover:text-slate-800">
          ← Workshops
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{workshop.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{workshop.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill status={workshop.status} />
            <DeleteWorkshopButton projectId={projectId} workshopId={workshop._id} workshopTitle={workshop.title} />
          </div>
        </div>
      </div>

      <WorkshopTabs workshopId={workshop._id} projectId={projectId} />
    </div>
  );
}
