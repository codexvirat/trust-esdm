"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createProjectAction, type FormState } from "@/app/actions/projects";

const initialState: FormState = {};

const PROJECT_TYPES = [
  { value: "university", label: "University" },
  { value: "company", label: "Company" },
  { value: "ngo", label: "NGO" },
  { value: "csr_partner", label: "CSR Partner" },
  { value: "government", label: "Government" },
  { value: "msme", label: "MSME" },
  { value: "other", label: "Other" },
];

export function CreateProjectForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createProjectAction, initialState);
  const wasPending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New project
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Onboard a new project</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Cancel
        </button>
      </div>

      <form ref={formRef} action={action} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Organisation name" htmlFor="name">
          <input id="name" name="name" required autoComplete="off" placeholder="Acme University" className={inputClass} />
        </Field>
        <Field label="Slug" htmlFor="slug" hint="lowercase, hyphens only — used to log in">
          <input
            id="slug"
            name="slug"
            required
            autoComplete="off"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="lowercase letters, numbers, and hyphens only"
            placeholder="acme-university"
            className={inputClass}
          />
        </Field>
        <Field label="Type" htmlFor="type">
          <select id="type" name="type" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select type
            </option>
            {PROJECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contact email" htmlFor="contactEmail">
          <input id="contactEmail" name="contactEmail" type="email" required placeholder="contact@acme.edu" className={inputClass} />
        </Field>
        <Field label="Contact phone" htmlFor="contactPhone">
          <input id="contactPhone" name="contactPhone" placeholder="(optional)" className={inputClass} />
        </Field>
        <Field label="Website" htmlFor="website">
          <input id="website" name="website" type="url" placeholder="https://acme.edu (optional)" className={inputClass} />
        </Field>

        {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label} {hint && <span className="font-normal text-slate-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
