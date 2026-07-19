"use client";

import { useActionState, useState } from "react";
import { createOrganisationAction, type FormState } from "@/app/actions/organisations";

const initialState: FormState = {};

const ORG_TYPES = [
  { value: "university", label: "University" },
  { value: "company", label: "Company" },
  { value: "ngo", label: "NGO" },
  { value: "csr_partner", label: "CSR Partner" },
  { value: "government", label: "Government" },
  { value: "msme", label: "MSME" },
  { value: "other", label: "Other" },
];

export function CreateOrganisationForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createOrganisationAction, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + New organisation
      </button>
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Organisation / Company Name</label>
        <input name="name" required placeholder="Acme Manufacturing Pvt Ltd" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required placeholder="contact@company.com" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Phone</label>
        <input name="phone" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Type</label>
        <select name="type" required defaultValue="" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Select type</option>
          {ORG_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Short Code</label>
        <input name="shortCode" required placeholder="e.g. ACME" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Address Line 1</label>
        <input name="addressLine1" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Address Line 2</label>
        <input name="addressLine2" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">City</label>
        <input name="city" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">District</label>
        <input name="district" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">State</label>
        <input name="state" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Pincode</label>
        <input name="pincode" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">GSTIN</label>
        <input name="gstin" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">PAN</label>
        <input name="pan" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Industry</label>
        <input name="industry" required placeholder="e.g. Electronics" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Number of Employees</label>
        <input name="employeeCount" type="number" min={1} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Date of Establishment</label>
        <input name="establishedDate" type="date" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {state.error && <p className="w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
          {pending ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
          Cancel
        </button>
      </div>
    </form>
  );
}
