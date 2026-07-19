"use client";

import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";

export function ProjectFilter({
  projects,
  selectedId,
  basePath,
}: {
  projects: Project[];
  selectedId: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="project-filter" className="text-sm font-medium text-slate-700">
        Project
      </label>
      <select
        id="project-filter"
        value={selectedId}
        onChange={(e) => router.push(`${basePath}?projectId=${e.target.value}`)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
