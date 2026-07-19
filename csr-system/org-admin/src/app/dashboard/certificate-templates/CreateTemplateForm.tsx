"use client";

import { useActionState, useState } from "react";
import { createCertificateTemplateAction, type FormState } from "@/app/actions/certificates";

const initialState: FormState = {};

export function CreateTemplateForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createCertificateTemplateAction, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New template
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Template name</label>
        <input name="name" required placeholder="Standard Certificate" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
        {pending ? "Creating…" : "Create"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
        Cancel
      </button>
    </form>
  );
}
