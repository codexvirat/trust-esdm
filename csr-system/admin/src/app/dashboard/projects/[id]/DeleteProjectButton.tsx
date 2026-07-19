"use client";

import { useTransition } from "react";
import { deleteProjectAction } from "@/app/actions/projects";

export function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Remove "${projectName}"? Every user, workshop, and record under it will become inaccessible. This cannot be undone from here.`)) {
          startTransition(() => {
            deleteProjectAction(projectId);
          });
        }
      }}
      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Removing…" : "Remove project"}
    </button>
  );
}
