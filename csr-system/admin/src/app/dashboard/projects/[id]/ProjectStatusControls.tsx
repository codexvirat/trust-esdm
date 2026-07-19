"use client";

import { useTransition } from "react";
import { setProjectStatusAction } from "@/app/actions/projects";
import type { ProjectStatus } from "@/lib/types";

const OPTIONS: { value: ProjectStatus; label: string; className: string }[] = [
  { value: "active", label: "Activate", className: "bg-emerald-700 hover:bg-emerald-800" },
  { value: "suspended", label: "Suspend", className: "bg-amber-700 hover:bg-amber-800" },
  { value: "inactive", label: "Deactivate", className: "bg-slate-700 hover:bg-slate-800" },
];

export function ProjectStatusControls({ projectId, currentStatus }: { projectId: string; currentStatus: ProjectStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.filter((o) => o.value !== currentStatus).map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setProjectStatusAction(projectId, o.value))}
          className={`rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 ${o.className}`}
        >
          {pending ? "Updating…" : o.label}
        </button>
      ))}
    </div>
  );
}
