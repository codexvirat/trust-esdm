"use client";

import { useActionState } from "react";
import { updateProjectAction, type FormState } from "@/app/actions/projects";
import type { Project } from "@/lib/types";

const initialState: FormState = {};

export function EditProjectForm({ project }: { project: Project }) {
  const bound = updateProjectAction.bind(null, project._id);
  const [state, action, pending] = useActionState(bound, initialState);

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Organisation name" htmlFor="name">
        <input id="name" name="name" defaultValue={project.name} required autoComplete="off" className={inputClass} />
      </Field>
      <Field label="Contact email" htmlFor="contactEmail">
        <input id="contactEmail" name="contactEmail" type="email" defaultValue={project.contactEmail} required className={inputClass} />
      </Field>
      <Field label="Contact phone" htmlFor="contactPhone">
        <input id="contactPhone" name="contactPhone" defaultValue={project.contactPhone ?? ""} className={inputClass} />
      </Field>
      <Field label="Website" htmlFor="website">
        <input id="website" name="website" type="url" defaultValue={project.website ?? ""} className={inputClass} />
      </Field>

      {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const inputClass = "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
