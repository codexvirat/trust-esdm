"use client";

import { useActionState, useState } from "react";
import { submitEnrollAction, type EnrollFormState } from "@/app/actions/enroll";
import { useEnrollTrack } from "./EnrollTrackContext";
import type { PublicOrganisation } from "@/lib/types";

const initialState: EnrollFormState = {};

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

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function EnrollForm({ tracks, organisations }: { tracks: { key: string; id: string; label: string }[]; organisations: PublicOrganisation[] }) {
  const [state, action, pending] = useActionState(submitEnrollAction, initialState);
  const { selectedTrack, setSelectedTrack } = useEnrollTrack();
  const [organisationId, setOrganisationId] = useState("");
  const companyListed = organisationId !== "";

  if (state.success) {
    return (
      <div className="success show">
        <div className="tick">✓</div>
        <h3 style={{ fontSize: "1.4rem" }}>Thanks — you&apos;re on the list.</h3>
        <p style={{ color: "var(--ink-soft)" }}>The DRIIV team will reach out to guide your next steps.</p>
      </div>
    );
  }

  return (
    <form action={action}>
      {state.error && <div className="form-error show" style={{ marginBottom: 20 }}>{state.error}</div>}

      <div className="form-section">
        <div className="form-section-heading">
          <span className="bar" />
          <h3>Basic Details</h3>
        </div>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <div className="field">
            <label htmlFor="firstName">First Name <span className="required-mark">*</span></label>
            <input id="firstName" name="firstName" required placeholder="Enter first name" />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last Name <span className="required-mark">*</span></label>
            <input id="lastName" name="lastName" required placeholder="Enter last name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email <span className="required-mark">*</span></label>
            <input id="email" name="email" type="email" required placeholder="candidate@example.com" />
          </div>
          <div className="field">
            <label htmlFor="phone">Contact Number <span className="required-mark">*</span></label>
            <input id="phone" name="phone" type="tel" required placeholder="10-digit mobile number" />
          </div>
          <div className="field">
            <label htmlFor="alternatePhone">Alternate Mobile Number <span className="required-mark">*</span></label>
            <input id="alternatePhone" name="alternatePhone" required placeholder="Alternate mobile number" />
          </div>
          <div className="field">
            <label htmlFor="dob">Date of Birth <span className="required-mark">*</span></label>
            <input id="dob" name="dob" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="bloodGroup">Blood Group <span className="required-mark">*</span></label>
            <select id="bloodGroup" name="bloodGroup" required defaultValue="">
              <option value="" disabled>Select Blood Group</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
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
            <label htmlFor="track">Which track interests you? <span className="required-mark">*</span></label>
            <select id="track" value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)} required>
              <option value="">Choose one</option>
              {tracks.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <input type="hidden" name="workshopId" value={tracks.find((t) => t.key === selectedTrack)?.id ?? ""} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-heading">
          <span className="bar" />
          <h3>Address</h3>
        </div>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <div className="field full">
            <label htmlFor="addressLine1">Address Line 1 <span className="required-mark">*</span></label>
            <input id="addressLine1" name="addressLine1" required placeholder="Flat, House no., Building, Apartment" />
          </div>
          <div className="field full">
            <label htmlFor="addressLine2">Address Line 2 <span className="required-mark">*</span></label>
            <input id="addressLine2" name="addressLine2" required placeholder="Area, Street, Sector, Village" />
          </div>
          <div className="field">
            <label htmlFor="city">City <span className="required-mark">*</span></label>
            <input id="city" name="city" required placeholder="Enter city" />
          </div>
          <div className="field">
            <label htmlFor="state">State <span className="required-mark">*</span></label>
            <input id="state" name="state" required placeholder="Enter state" />
          </div>
          <div className="field">
            <label htmlFor="country">Country <span className="required-mark">*</span></label>
            <input id="country" name="country" required placeholder="Enter country" />
          </div>
          <div className="field">
            <label htmlFor="pincode">Pincode <span className="required-mark">*</span></label>
            <input id="pincode" name="pincode" required placeholder="6-digit pincode" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-heading">
          <span className="bar" />
          <h3>Education & Skills</h3>
        </div>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <div className="field">
            <label htmlFor="degree">Highest Qualification <span className="required-mark">*</span></label>
            <input id="degree" name="degree" required placeholder="e.g. B.Sc, Diploma" />
          </div>
          <div className="field">
            <label htmlFor="institution">Institution <span className="required-mark">*</span></label>
            <input id="institution" name="institution" required placeholder="Enter institution name" />
          </div>
          <div className="field">
            <label htmlFor="fieldOfStudy">Field of Study <span className="required-mark">*</span></label>
            <input id="fieldOfStudy" name="fieldOfStudy" required placeholder="e.g. Computer Science" />
          </div>
          <div className="field">
            <label htmlFor="grade">Grade / Percentage <span className="required-mark">*</span></label>
            <input id="grade" name="grade" required placeholder="e.g. 8.2 CGPA" />
          </div>
          <div className="field">
            <label htmlFor="startYear">Start Year <span className="required-mark">*</span></label>
            <input id="startYear" name="startYear" type="number" required placeholder="e.g. 2018" />
          </div>
          <div className="field">
            <label htmlFor="endYear">End Year <span className="required-mark">*</span></label>
            <input id="endYear" name="endYear" type="number" required placeholder="e.g. 2022" />
          </div>
          <div className="field full">
            <label htmlFor="skills">Skills <span className="required-mark">*</span></label>
            <input id="skills" name="skills" required placeholder="Comma-separated, e.g. Excel, Communication, Tailoring" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-heading accent-blue">
          <span className="bar" />
          <h3>Organisation Details</h3>
        </div>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <div className="field full">
            <label htmlFor="organisationId">Select your company <span className="required-mark">*</span></label>
            <select id="organisationId" name="organisationId" value={organisationId} onChange={(e) => setOrganisationId(e.target.value)}>
              <option value="">My company is not listed — enter details manually</option>
              {organisations.map((o) => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!companyListed && (
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="orgName">Organisation / Company Name <span className="required-mark">*</span></label>
              <input id="orgName" name="orgName" required placeholder="Enter official organisation name" />
            </div>
            <div className="field">
              <label htmlFor="orgEmail">Company Email <span className="required-mark">*</span></label>
              <input id="orgEmail" name="orgEmail" type="email" required placeholder="e.g. contact@company.com" />
            </div>
            <div className="field">
              <label htmlFor="orgPhone">Company Phone <span className="required-mark">*</span></label>
              <input id="orgPhone" name="orgPhone" required placeholder="Company contact number" />
            </div>
            <div className="field">
              <label htmlFor="orgType">Organisation Type <span className="required-mark">*</span></label>
              <select id="orgType" name="orgType" required defaultValue="">
                <option value="" disabled>Select Organisation Type</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label htmlFor="orgAddressLine1">Organisation Address Line 1 <span className="required-mark">*</span></label>
              <input id="orgAddressLine1" name="orgAddressLine1" required placeholder="Flat, House no., Building, Company, Apartment" />
            </div>
            <div className="field full">
              <label htmlFor="orgAddressLine2">Organisation Address Line 2 <span className="required-mark">*</span></label>
              <input id="orgAddressLine2" name="orgAddressLine2" required placeholder="Area, Street, Sector, Village" />
            </div>
            <div className="field">
              <label htmlFor="orgState">State <span className="required-mark">*</span></label>
              <input id="orgState" name="orgState" required placeholder="Enter state" />
            </div>
            <div className="field">
              <label htmlFor="orgDistrict">District <span className="required-mark">*</span></label>
              <input id="orgDistrict" name="orgDistrict" required placeholder="Enter district" />
            </div>
            <div className="field">
              <label htmlFor="orgCity">City <span className="required-mark">*</span></label>
              <input id="orgCity" name="orgCity" required placeholder="Enter city" />
            </div>
            <div className="field">
              <label htmlFor="orgPincode">Pincode <span className="required-mark">*</span></label>
              <input id="orgPincode" name="orgPincode" required placeholder="6-digit pincode" />
            </div>
          </div>
        )}
      </div>

      {!companyListed && (
        <div className="form-section">
          <div className="form-section-heading">
            <span className="bar" />
            <h3>Additional Information</h3>
          </div>
          <div className="form-grid" style={{ marginTop: 0 }}>
            <div className="field">
              <label htmlFor="gstin">GST Details <span className="required-mark">*</span></label>
              <input id="gstin" name="gstin" required placeholder="e.g. 15-digit GSTIN" />
            </div>
            <div className="field">
              <label htmlFor="pan">Company PAN <span className="required-mark">*</span></label>
              <input id="pan" name="pan" required placeholder="e.g. 10-digit PAN" />
            </div>
            <div className="field">
              <label htmlFor="shortCode">Short Code <span className="required-mark">*</span></label>
              <input id="shortCode" name="shortCode" required placeholder="e.g. TRC" />
            </div>
            <div className="field">
              <label htmlFor="industry">Industry <span className="required-mark">*</span></label>
              <input id="industry" name="industry" required placeholder="e.g. Technology" />
            </div>
            <div className="field">
              <label htmlFor="employeeCount">Number of Employees <span className="required-mark">*</span></label>
              <input id="employeeCount" name="employeeCount" type="number" min={1} required placeholder="e.g. 50" />
            </div>
            <div className="field">
              <label htmlFor="establishedDate">Date of Establishment <span className="required-mark">*</span></label>
              <input id="establishedDate" name="establishedDate" type="date" required />
            </div>
          </div>
        </div>
      )}

      <div className="submit-row">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Submitting…" : "Submit my interest"}</button>
        <span className="form-note">No cost to apply. We&apos;ll respond within a few working days.</span>
      </div>
    </form>
  );
}
