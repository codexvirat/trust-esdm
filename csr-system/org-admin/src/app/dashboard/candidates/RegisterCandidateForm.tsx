"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registerCandidateProfileAction, type FormState } from "@/app/actions/candidates";

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

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function RegisterCandidateForm() {
  const [open, setOpen] = useState(false);
  const [hasOrg, setHasOrg] = useState(false);
  const [state, action, pending] = useActionState(registerCandidateProfileAction, initialState);
  const wasPending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
      setHasOrg(false);
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + Register candidate
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Register a candidate</h2>
          <p className="mt-1 text-xs text-slate-500">
            This creates their account. Enroll them into a workshop batch afterward from the list below — that&apos;s when they get
            their login and QR badge by email.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Cancel
        </button>
      </div>

      <form ref={formRef} action={action} className="mt-4 flex flex-col gap-8">
        <section>
          <SectionHeading accent="amber" title="Basic Details" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" htmlFor="firstName" required>
              <input id="firstName" name="firstName" required placeholder="Enter first name" className={inputClass} />
            </Field>
            <Field label="Last Name" htmlFor="lastName" required>
              <input id="lastName" name="lastName" required placeholder="Enter last name" className={inputClass} />
            </Field>
            <Field label="Email" htmlFor="email" required>
              <input id="email" name="email" type="email" required placeholder="candidate@example.com" className={inputClass} />
            </Field>
            <Field label="Contact Number" htmlFor="phone" required>
              <input id="phone" name="phone" required placeholder="10-digit mobile number" className={inputClass} />
            </Field>
            <Field label="Alternate Mobile Number" htmlFor="alternatePhone">
              <input id="alternatePhone" name="alternatePhone" placeholder="Alternate mobile number (optional)" className={inputClass} />
            </Field>
            <Field label="Date of Birth" htmlFor="dob" required>
              <input id="dob" name="dob" type="date" required className={inputClass} />
            </Field>
            <Field label="Blood Group" htmlFor="bloodGroup">
              <select id="bloodGroup" name="bloodGroup" defaultValue="" className={inputClass}>
                <option value="">Select Blood Group (optional)</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={hasOrg} onChange={(e) => setHasOrg(e.target.checked)} className="h-4 w-4 accent-slate-900" />
            This candidate is affiliated with an organisation (company / NGO / school)
          </label>
        </section>

        {hasOrg && (
          <>
            <section>
              <SectionHeading accent="blue" title="Organisation Details" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Organisation / Company Name" htmlFor="orgName" required>
                  <input id="orgName" name="orgName" required={hasOrg} placeholder="Enter official organisation name" className={inputClass} />
                </Field>
                <Field label="Company Email" htmlFor="orgEmail" required>
                  <input id="orgEmail" name="orgEmail" type="email" required={hasOrg} placeholder="e.g. contact@company.com" className={inputClass} />
                </Field>
                <Field label="Company Phone" htmlFor="orgPhone">
                  <input id="orgPhone" name="orgPhone" placeholder="Company contact number (optional)" className={inputClass} />
                </Field>
                <Field label="Organisation Type" htmlFor="orgType" required>
                  <select id="orgType" name="orgType" required={hasOrg} defaultValue="" className={inputClass}>
                    <option value="" disabled>
                      Select Organisation Type
                    </option>
                    {PROJECT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Organisation Address Line 1" htmlFor="orgAddressLine1" required className="sm:col-span-2">
                  <input
                    id="orgAddressLine1"
                    name="orgAddressLine1"
                    required={hasOrg}
                    placeholder="Flat, House no., Building, Company, Apartment"
                    className={inputClass}
                  />
                </Field>
                <Field label="Organisation Address Line 2" htmlFor="orgAddressLine2" className="sm:col-span-2">
                  <input id="orgAddressLine2" name="orgAddressLine2" placeholder="Area, Street, Sector, Village (optional)" className={inputClass} />
                </Field>
                <Field label="State" htmlFor="orgState" required>
                  <input id="orgState" name="orgState" required={hasOrg} placeholder="Enter state" className={inputClass} />
                </Field>
                <Field label="District" htmlFor="orgDistrict" required>
                  <input id="orgDistrict" name="orgDistrict" required={hasOrg} placeholder="Enter district" className={inputClass} />
                </Field>
                <Field label="City" htmlFor="orgCity" required>
                  <input id="orgCity" name="orgCity" required={hasOrg} placeholder="Enter city" className={inputClass} />
                </Field>
                <Field label="Pincode" htmlFor="orgPincode" required>
                  <input id="orgPincode" name="orgPincode" required={hasOrg} placeholder="6-digit pincode" className={inputClass} />
                </Field>
              </div>
            </section>

            <section>
              <SectionHeading accent="amber" title="Additional Information" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="GST Details" htmlFor="gstin">
                  <input id="gstin" name="gstin" placeholder="e.g. 15-digit GSTIN" className={inputClass} />
                </Field>
                <Field label="Company PAN" htmlFor="pan">
                  <input id="pan" name="pan" placeholder="e.g. 10-digit PAN" className={inputClass} />
                </Field>
                <Field label="Short Code" htmlFor="shortCode" required>
                  <input id="shortCode" name="shortCode" required={hasOrg} placeholder="e.g. TRC" className={inputClass} />
                </Field>
                <Field label="Industry" htmlFor="industry" required>
                  <input id="industry" name="industry" required={hasOrg} placeholder="e.g. Technology" className={inputClass} />
                </Field>
                <Field label="Number of Employees" htmlFor="employeeCount" required>
                  <input id="employeeCount" name="employeeCount" type="number" min={1} required={hasOrg} placeholder="e.g. 50" className={inputClass} />
                </Field>
                <Field label="Date of Establishment" htmlFor="establishedDate" required>
                  <input id="establishedDate" name="establishedDate" type="date" required={hasOrg} className={inputClass} />
                </Field>
              </div>
            </section>
          </>
        )}

        {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Submit Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionHeading({ title, accent }: { title: string; accent: "amber" | "blue" }) {
  const barColor = accent === "amber" ? "bg-amber-500" : "bg-blue-600";
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
      <span className={`h-4 w-1 rounded-full ${barColor}`} />
      <h3 className="text-sm font-semibold text-blue-950">{title}</h3>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500";
