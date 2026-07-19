"use client";

import { useTransition } from "react";
import { deleteVenueAction } from "@/app/actions/venues";
import type { Venue } from "@/lib/types";

export function VenueRow({ projectId, venue }: { projectId: string; venue: Venue }) {
  const [pending, startTransition] = useTransition();

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">{venue.name}</td>
      <td className="px-4 py-3 text-slate-600">{venue.city ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{venue.capacity ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{venue.address ?? "—"}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete venue "${venue.name}"?`)) startTransition(() => deleteVenueAction(projectId, venue._id));
          }}
          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}
