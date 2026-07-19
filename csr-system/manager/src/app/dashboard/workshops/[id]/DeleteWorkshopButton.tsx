"use client";

import { useTransition } from "react";
import { deleteWorkshopAction } from "@/app/actions/workshops";

export function DeleteWorkshopButton({ workshopId, workshopTitle }: { workshopId: string; workshopTitle: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Delete "${workshopTitle}"? This cannot be undone.`)) {
          startTransition(() => {
            deleteWorkshopAction(workshopId);
          });
        }
      }}
      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
