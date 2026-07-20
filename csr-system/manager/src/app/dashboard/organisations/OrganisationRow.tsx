"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { deleteOrganisationAction } from "@/app/actions/organisations";
import { EditOrganisationModal } from "./EditOrganisationModal";
import type { Organisation } from "@/lib/types";

export function OrganisationRow({ organisation }: { organisation: Organisation }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">{organisation.name}</td>
      <td className="px-4 py-3 text-slate-600 capitalize">{organisation.type?.replace("_", " ") ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{organisation.city ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{organisation.email ?? "—"}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Delete organisation "${organisation.name}"? It will no longer be selectable on the registration form.`)) {
                startTransition(() => deleteOrganisationAction(organisation._id));
              }
            }}
            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </td>
      {editing && createPortal(<EditOrganisationModal organisation={organisation} onClose={() => setEditing(false)} />, document.body)}
    </tr>
  );
}
