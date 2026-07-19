"use client";

import { useTransition } from "react";
import { deleteOrganisationAction } from "@/app/actions/organisations";
import type { Organisation } from "@/lib/types";

export function OrganisationRow({ organisation }: { organisation: Organisation }) {
  const [pending, startTransition] = useTransition();

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">{organisation.name}</td>
      <td className="px-4 py-3 text-slate-600 capitalize">{organisation.type?.replace("_", " ") ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{organisation.city ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{organisation.email ?? "—"}</td>
      <td className="px-4 py-3">
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
      </td>
    </tr>
  );
}
