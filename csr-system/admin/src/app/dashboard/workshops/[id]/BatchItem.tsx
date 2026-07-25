import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import type { Batch } from "@/lib/types";

export function BatchItem({ projectId, workshopId, batch }: { projectId: string; workshopId: string; batch: Batch }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">
          {batch.name} <span className="text-slate-400">({batch.code})</span>
        </p>
        <StatusPill status={batch.status} />
      </div>

      <p className="text-xs text-slate-500">
        {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()} · {batch.enrolledCount}
        {batch.capacity ? ` / ${batch.capacity}` : ""} enrolled
      </p>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <Link
          href={`/dashboard/workshops/${workshopId}/batches/${batch._id}?projectId=${projectId}`}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
        >
          Attendance, photos &amp; candidates →
        </Link>
        <Link
          href={`/dashboard/workshops/${workshopId}/batches/${batch._id}/manage?projectId=${projectId}`}
          className="text-xs font-medium text-slate-400 hover:text-slate-700 hover:underline"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
}
