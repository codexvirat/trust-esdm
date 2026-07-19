"use client";

import { useTransition } from "react";
import { deleteWorkshopCategoryAction } from "@/app/actions/workshopCategories";
import type { WorkshopCategory } from "@/lib/types";

export function WorkshopCategoryRow({ projectId, category }: { projectId: string; category: WorkshopCategory }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{category.name}</p>
        {category.description && <p className="text-xs text-slate-500">{category.description}</p>}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Delete category "${category.name}"?`)) startTransition(() => deleteWorkshopCategoryAction(projectId, category._id));
        }}
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
    </li>
  );
}
