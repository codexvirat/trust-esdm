"use client";

import { useActionState, useState } from "react";
import { createOrganisationAction, type FormState } from "@/app/actions/organisations";
import { OrganisationFormFields } from "./OrganisationFormFields";

const initialState: FormState = {};

export function CreateOrganisationForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const bound = createOrganisationAction.bind(null, projectId);
  const [state, action, pending] = useActionState(bound, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + New organisation
      </button>
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
      <OrganisationFormFields />

      {state.error && <p className="w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
          Cancel
        </button>
      </div>
    </form>
  );
}
