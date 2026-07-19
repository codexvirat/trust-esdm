"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { CandidateProfile, EducationEntry } from "@/lib/types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const PROJECT_TYPES = ["university", "company", "ngo", "csr_partner", "government", "msme", "other"];

function toDateInputValue(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

// Older saves could persist fully-blank rows (e.g. "+ Add education" clicked but
// never filled in) — drop those so they don't resurface as empty rows forever.
function isBlankEducationEntry(entry: EducationEntry): boolean {
  return !entry.degree && !entry.institution && !entry.fieldOfStudy && !entry.startYear && !entry.endYear && !entry.grade;
}

export function ProfileForm({ profile }: { profile: CandidateProfile | null }) {
  const [dob, setDob] = useState(toDateInputValue(profile?.dob));
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup ?? "");
  const [alternatePhone, setAlternatePhone] = useState(profile?.alternatePhone ?? "");
  const [affiliatedOrganisation, setAffiliatedOrganisation] = useState({
    name: profile?.affiliatedOrganisation?.name ?? "",
    email: profile?.affiliatedOrganisation?.email ?? "",
    phone: profile?.affiliatedOrganisation?.phone ?? "",
    type: profile?.affiliatedOrganisation?.type ?? "",
    addressLine1: profile?.affiliatedOrganisation?.addressLine1 ?? "",
    addressLine2: profile?.affiliatedOrganisation?.addressLine2 ?? "",
    state: profile?.affiliatedOrganisation?.state ?? "",
    district: profile?.affiliatedOrganisation?.district ?? "",
    city: profile?.affiliatedOrganisation?.city ?? "",
    pincode: profile?.affiliatedOrganisation?.pincode ?? "",
    gstin: profile?.affiliatedOrganisation?.gstin ?? "",
    pan: profile?.affiliatedOrganisation?.pan ?? "",
    shortCode: profile?.affiliatedOrganisation?.shortCode ?? "",
    industry: profile?.affiliatedOrganisation?.industry ?? "",
    employeeCount: profile?.affiliatedOrganisation?.employeeCount?.toString() ?? "",
    establishedDate: toDateInputValue(profile?.affiliatedOrganisation?.establishedDate),
  });
  const [address, setAddress] = useState({
    line1: profile?.address?.line1 ?? "",
    line2: profile?.address?.line2 ?? "",
    city: profile?.address?.city ?? "",
    state: profile?.address?.state ?? "",
    country: profile?.address?.country ?? "",
    pincode: profile?.address?.pincode ?? "",
  });
  const [education, setEducation] = useState<EducationEntry[]>((profile?.education ?? []).filter((e) => !isBlankEducationEntry(e)));
  const [skillsText, setSkillsText] = useState((profile?.skills ?? []).join(", "));
  const [socialLinks, setSocialLinks] = useState({
    linkedin: profile?.socialLinks?.linkedin ?? "",
    github: profile?.socialLinks?.github ?? "",
    portfolio: profile?.socialLinks?.portfolio ?? "",
    twitter: profile?.socialLinks?.twitter ?? "",
  });
  const [emergencyContact, setEmergencyContact] = useState({
    name: profile?.emergencyContact?.name ?? "",
    relation: profile?.emergencyContact?.relation ?? "",
    phone: profile?.emergencyContact?.phone ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function updateEducation(index: number, patch: Partial<EducationEntry>) {
    setEducation((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function submit() {
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfileAction({
        dob: dob || undefined,
        gender: gender || undefined,
        bloodGroup: bloodGroup || undefined,
        alternatePhone: alternatePhone || undefined,
        address,
        education: education.filter((e) => !isBlankEducationEntry(e)),
        skills: skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        socialLinks,
        emergencyContact,
        affiliatedOrganisation: affiliatedOrganisation.name
          ? {
              name: affiliatedOrganisation.name,
              email: affiliatedOrganisation.email || undefined,
              phone: affiliatedOrganisation.phone || undefined,
              type: affiliatedOrganisation.type || undefined,
              addressLine1: affiliatedOrganisation.addressLine1 || undefined,
              addressLine2: affiliatedOrganisation.addressLine2 || undefined,
              state: affiliatedOrganisation.state || undefined,
              district: affiliatedOrganisation.district || undefined,
              city: affiliatedOrganisation.city || undefined,
              pincode: affiliatedOrganisation.pincode || undefined,
              gstin: affiliatedOrganisation.gstin || undefined,
              pan: affiliatedOrganisation.pan || undefined,
              shortCode: affiliatedOrganisation.shortCode || undefined,
              industry: affiliatedOrganisation.industry || undefined,
              employeeCount: affiliatedOrganisation.employeeCount ? Number(affiliatedOrganisation.employeeCount) : undefined,
              establishedDate: affiliatedOrganisation.establishedDate || undefined,
            }
          : undefined,
      });
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Personal information</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date of birth" htmlFor="dob">
            <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Gender" htmlFor="gender">
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Blood group" htmlFor="bloodGroup">
            <select id="bloodGroup" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={inputClass}>
              <option value="">Not set</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </Field>
          <Field label="Alternate phone" htmlFor="alternatePhone">
            <input id="alternatePhone" value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Address</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Line 1" htmlFor="line1">
            <input id="line1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Line 2" htmlFor="line2">
            <input id="line2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className={inputClass} />
          </Field>
          <Field label="City" htmlFor="city">
            <input id="city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className={inputClass} />
          </Field>
          <Field label="State" htmlFor="state">
            <input id="state" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Country" htmlFor="country">
            <input id="country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Pincode" htmlFor="pincode">
            <input id="pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Education</h2>
          <button
            type="button"
            onClick={() => setEducation((rows) => [...rows, { degree: "", institution: "", fieldOfStudy: "", startYear: undefined, endYear: undefined, grade: "" }])}
            className="text-xs font-medium text-teal-700 hover:text-teal-900"
          >
            + Add education
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {education.map((entry, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-6">
              <input
                placeholder="Degree"
                value={entry.degree ?? ""}
                onChange={(e) => updateEducation(index, { degree: e.target.value })}
                className={`${inputClass} sm:col-span-2`}
              />
              <input
                placeholder="Institution"
                value={entry.institution ?? ""}
                onChange={(e) => updateEducation(index, { institution: e.target.value })}
                className={`${inputClass} sm:col-span-2`}
              />
              <input
                placeholder="Field of study"
                value={entry.fieldOfStudy ?? ""}
                onChange={(e) => updateEducation(index, { fieldOfStudy: e.target.value })}
                className={`${inputClass} sm:col-span-2`}
              />
              <input
                type="number"
                placeholder="Start year"
                value={entry.startYear ?? ""}
                onChange={(e) => updateEducation(index, { startYear: e.target.value ? Number(e.target.value) : undefined })}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="End year"
                value={entry.endYear ?? ""}
                onChange={(e) => updateEducation(index, { endYear: e.target.value ? Number(e.target.value) : undefined })}
                className={inputClass}
              />
              <input
                placeholder="Grade"
                value={entry.grade ?? ""}
                onChange={(e) => updateEducation(index, { grade: e.target.value })}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setEducation((rows) => rows.filter((_, i) => i !== index))}
                className="self-start text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          {education.length === 0 && <p className="text-xs text-slate-400">No education added yet.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Skills</h2>
        <div className="mt-4 flex flex-col gap-1">
          <label htmlFor="skills" className="text-sm font-medium text-slate-700">
            Comma-separated
          </label>
          <input id="skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="First aid, Public speaking, Excel" className={inputClass} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Social links</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="LinkedIn" htmlFor="linkedin">
            <input id="linkedin" value={socialLinks.linkedin} onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })} className={inputClass} />
          </Field>
          <Field label="GitHub" htmlFor="github">
            <input id="github" value={socialLinks.github} onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Portfolio" htmlFor="portfolio">
            <input id="portfolio" value={socialLinks.portfolio} onChange={(e) => setSocialLinks({ ...socialLinks, portfolio: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Twitter / X" htmlFor="twitter">
            <input id="twitter" value={socialLinks.twitter} onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Emergency contact</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name" htmlFor="ec-name">
            <input id="ec-name" value={emergencyContact.name} onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Relation" htmlFor="ec-relation">
            <input id="ec-relation" value={emergencyContact.relation} onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Phone" htmlFor="ec-phone">
            <input id="ec-phone" value={emergencyContact.phone} onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Affiliated organisation</h2>
        <p className="mt-1 text-xs text-slate-400">If you&apos;re affiliated with a company, NGO, or school, fill this in.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Organisation name" htmlFor="org-name">
            <input
              id="org-name"
              value={affiliatedOrganisation.name}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Type" htmlFor="org-type">
            <select
              id="org-type"
              value={affiliatedOrganisation.type}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, type: e.target.value })}
              className={inputClass}
            >
              <option value="">Not set</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </Field>
          <Field label="Email" htmlFor="org-email">
            <input
              id="org-email"
              type="email"
              value={affiliatedOrganisation.email}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Phone" htmlFor="org-phone">
            <input
              id="org-phone"
              value={affiliatedOrganisation.phone}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, phone: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Industry" htmlFor="org-industry">
            <input
              id="org-industry"
              value={affiliatedOrganisation.industry}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, industry: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Short code" htmlFor="org-shortCode">
            <input
              id="org-shortCode"
              value={affiliatedOrganisation.shortCode}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, shortCode: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Address line 1" htmlFor="org-addressLine1">
            <input
              id="org-addressLine1"
              value={affiliatedOrganisation.addressLine1}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, addressLine1: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Address line 2" htmlFor="org-addressLine2">
            <input
              id="org-addressLine2"
              value={affiliatedOrganisation.addressLine2}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, addressLine2: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="City" htmlFor="org-city">
            <input
              id="org-city"
              value={affiliatedOrganisation.city}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, city: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="District" htmlFor="org-district">
            <input
              id="org-district"
              value={affiliatedOrganisation.district}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, district: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="State" htmlFor="org-state">
            <input
              id="org-state"
              value={affiliatedOrganisation.state}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, state: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Pincode" htmlFor="org-pincode">
            <input
              id="org-pincode"
              value={affiliatedOrganisation.pincode}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, pincode: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="GSTIN" htmlFor="org-gstin">
            <input
              id="org-gstin"
              value={affiliatedOrganisation.gstin}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, gstin: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="PAN" htmlFor="org-pan">
            <input
              id="org-pan"
              value={affiliatedOrganisation.pan}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, pan: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Number of employees" htmlFor="org-employeeCount">
            <input
              id="org-employeeCount"
              type="number"
              value={affiliatedOrganisation.employeeCount}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, employeeCount: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Date of establishment" htmlFor="org-establishedDate">
            <input
              id="org-establishedDate"
              type="date"
              value={affiliatedOrganisation.establishedDate}
              onChange={(e) => setAffiliatedOrganisation({ ...affiliatedOrganisation, establishedDate: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && !error && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Profile saved.</p>}

      <div>
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

const inputClass = "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

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
