"use client";

import { useActionState, useState } from "react";
import { createWorkshopAction, type FormState } from "@/app/actions/workshops";

const initialState: FormState = {};

export function CreateWorkshopForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const bound = createWorkshopAction.bind(null, projectId);
  const [state, action, pending] = useActionState(bound, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        + New workshop
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">New workshop</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Cancel
        </button>
      </div>

      <form action={action} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" name="title" required className="sm:col-span-2" />
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <SelectField label="Type" name="type" options={["workshop", "bootcamp", "seminar", "csr_drive", "webinar", "other"]} />
        <SelectField label="Mode" name="mode" options={["offline", "online", "hybrid"]} />
        <Field label="Capacity" name="capacity" type="number" />

        {state.error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {state.error}
          </p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create workshop"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", required, className }: { label: string; name: string; type?: string; required?: boolean; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
      />
    </div>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
