"use client";

import { useActionState, useState } from "react";
import { submitEnrollAction, type EnrollFormState } from "@/app/actions/enroll";
import type { PublicOrganisation } from "@/lib/types";

const initialState: EnrollFormState = {};

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function EnrollForm({ workshopId, organisations }: { workshopId: string; organisations: PublicOrganisation[] }) {
  const [state, action, pending] = useActionState(submitEnrollAction, initialState);
  const [companyName, setCompanyName] = useState("");
  // Typing (or picking from the suggestions) the exact name of a staff-registered company links the
  // registration to that Organisation record; anything else is saved as a manually-typed company name.
  const matchedOrganisation = organisations.find((o) => o.name.trim().toLowerCase() === companyName.trim().toLowerCase());

  if (state.success) {
    return (
      <div className="success show">
        <div className="tick">✓</div>
        <h3 style={{ fontSize: "1.4rem" }}>Thanks — you&apos;re on the list.</h3>
        <p style={{ color: "var(--ink-soft)" }}>The TRUST-ESDM team will contact you with the cohort date for your state.</p>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="workshopId" value={workshopId} />
      <input type="hidden" name="organisationId" value={matchedOrganisation?._id ?? ""} />
      {state.error && <div className="form-error show" style={{ marginBottom: 20 }}>{state.error}</div>}

      <div className="form-section">
        <div className="form-section-heading">
          <span className="bar" />
          <h3>Basic Details</h3>
        </div>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <div className="field">
            <label htmlFor="fullName">Full Name <span className="required-mark">*</span></label>
            <input id="fullName" name="fullName" required minLength={2} autoComplete="name" placeholder="Enter full name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email Address <span className="required-mark">*</span></label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="phone">Mobile Number <span className="required-mark">*</span></label>
            <input id="phone" name="phone" type="tel" required inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" />
          </div>
          <div className="field">
            <label htmlFor="idNumber">Aadhaar / PAN Number <span className="required-mark">*</span></label>
            <input id="idNumber" name="idNumber" required placeholder="12-digit Aadhaar or 10-character PAN" />
          </div>
          <div className="field">
            <label htmlFor="gender">Gender <span className="required-mark">*</span></label>
            <select id="gender" name="gender" required defaultValue="">
              <option value="" disabled>Select Gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="companyName">Company Name <span className="required-mark">*</span></label>
            <input
              id="companyName"
              name="companyName"
              required
              list="company-suggestions"
              autoComplete="organization"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <datalist id="company-suggestions">
              {organisations.map((o) => (
                <option key={o._id} value={o.name} />
              ))}
            </datalist>
          </div>
          <div className="field full">
            <label htmlFor="address">Address <span className="required-mark">*</span></label>
            <textarea id="address" name="address" required rows={3} autoComplete="street-address" placeholder="House / building, street, area, city, state, pincode" />
          </div>
        </div>
      </div>

      <div className="submit-row">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Submitting…" : "Submit"}</button>
        <span className="form-note">Zero fee for eligible MSMEs. Our team will get back to you.</span>
      </div>
    </form>
  );
}
