"use client";

import { useState } from "react";
import type { Organisation } from "@/lib/types";

const ORG_TYPES = [
  { value: "university", label: "University" },
  { value: "company", label: "Company" },
  { value: "ngo", label: "NGO" },
  { value: "csr_partner", label: "CSR Partner" },
  { value: "government", label: "Government" },
  { value: "msme", label: "MSME" },
  { value: "other", label: "Other" },
];

export const inputClass = "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";

export function OrganisationFormFields({ defaults }: { defaults?: Organisation }) {
  const [type, setType] = useState(defaults?.type ?? "");

  return (
    <>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Organisation / Company Name</label>
        <input name="name" required defaultValue={defaults?.name} placeholder="Acme Manufacturing Pvt Ltd" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" defaultValue={defaults?.email} placeholder="contact@company.com" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Phone</label>
        <input name="phone" defaultValue={defaults?.phone} className={inputClass} />
      </div>
      <p className="-mt-2 text-xs text-slate-400 sm:col-span-2">Provide at least one of email or phone.</p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Type</label>
        <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
          <option value="">Select type</option>
          {ORG_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {type === "company" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">CIN</label>
          <input name="cin" defaultValue={defaults?.cin} placeholder="Corporate Identification Number" className={inputClass} />
        </div>
      )}
      {type === "msme" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Udyam Number</label>
          <input name="udyamNumber" defaultValue={defaults?.udyamNumber} placeholder="UDYAM-XX-00-0000000" className={inputClass} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Short Code</label>
        <input name="shortCode" defaultValue={defaults?.shortCode} placeholder="e.g. ACME" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Address Line 1</label>
        <input name="addressLine1" defaultValue={defaults?.addressLine1} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">Address Line 2</label>
        <input name="addressLine2" defaultValue={defaults?.addressLine2} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">City</label>
        <input name="city" defaultValue={defaults?.city} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">District</label>
        <input name="district" defaultValue={defaults?.district} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">State</label>
        <input name="state" defaultValue={defaults?.state} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Pincode</label>
        <input name="pincode" defaultValue={defaults?.pincode} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">GSTIN</label>
        <input name="gstin" defaultValue={defaults?.gstin} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">PAN</label>
        <input name="pan" defaultValue={defaults?.pan} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Industry</label>
        <input name="industry" defaultValue={defaults?.industry} placeholder="e.g. Electronics" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Number of Employees</label>
        <input name="employeeCount" type="number" min={1} defaultValue={defaults?.employeeCount} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Date of Establishment</label>
        <input
          name="establishedDate"
          type="date"
          defaultValue={defaults?.establishedDate ? defaults.establishedDate.slice(0, 10) : undefined}
          className={inputClass}
        />
      </div>
    </>
  );
}
