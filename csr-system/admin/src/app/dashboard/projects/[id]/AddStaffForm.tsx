"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createUserInProjectAction, type FormState } from "@/app/actions/users";

const initialState: FormState = {};

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "workshop_manager", label: "Workshop Manager" },
  { value: "trainer", label: "Trainer" },
];

export function AddStaffForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const bound = createUserInProjectAction.bind(null, projectId);
  const [state, action, pending] = useActionState(bound, initialState);
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
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
        + Add staff account
      </button>
    );
  }

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Role</label>
        <select name="roleCode" required defaultValue="admin" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Full name</label>
        <input name="fullName" required autoComplete="off" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Email</label>
        <input name="email" type="email" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Phone</label>
        <input name="phone" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      {state.error && <p role="alert" className="w-full text-xs text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-800">
        Cancel
      </button>
    </form>
  );
}
