import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { GENDERS, BLOOD_GROUPS, PROJECT_TYPES } from "../types/enums";

const addressSchema = new Schema(
  { line1: String, line2: String, city: String, state: String, country: String, pincode: String },
  { _id: false },
);

const educationEntrySchema = new Schema(
  {
    degree: String,
    institution: String,
    fieldOfStudy: String,
    startYear: Number,
    endYear: Number,
    grade: String,
  },
  { _id: false },
);

const socialLinksSchema = new Schema(
  { linkedin: String, github: String, portfolio: String, twitter: String },
  { _id: false },
);

const emergencyContactSchema = new Schema({ name: String, relation: String, phone: String }, { _id: false });

// The organisation/company/NGO a candidate is affiliated with (their employer
// or the partner project sponsoring their attendance) — distinct from the
// platform's own multi-tenant Project model. Entirely optional: most
// individual walk-in candidates won't have any of this.
const affiliatedOrganisationSchema = new Schema(
  {
    name: String,
    email: String,
    phone: String,
    type: { type: String, enum: PROJECT_TYPES },
    addressLine1: String,
    addressLine2: String,
    state: String,
    district: String,
    city: String,
    pincode: String,
    gstin: String,
    pan: String,
    shortCode: String,
    industry: String,
    employeeCount: Number,
    establishedDate: Date,
  },
  { _id: false },
);

const candidateProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  dob: Date,
  gender: { type: String, enum: GENDERS },
  bloodGroup: { type: String, enum: BLOOD_GROUPS },
  alternatePhone: String,
  address: addressSchema,
  education: { type: [educationEntrySchema], default: [] },
  skills: { type: [String], default: [] },
  resumeMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  photoMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  socialLinks: socialLinksSchema,
  emergencyContact: emergencyContactSchema,
  // Copied from Registration.organisationId on approval (registration.service.ts#approveRegistration)
  // when the candidate selected a staff-registered company rather than typing one manually.
  organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", default: null },
  affiliatedOrganisation: affiliatedOrganisationSchema,
  alumniStatus: { type: Boolean, default: false },
  profileCompletionPercent: { type: Number, default: 0, min: 0, max: 100 },
  // Opaque per-candidate badge, shown as a QR on the candidate dashboard.
  // Deliberately NOT a login credential — it identifies the candidate for
  // staff-initiated attendance scanning only, so a shared/lost QR can't be
  // used to sign in as them, and can be rotated independently of the password.
  attendanceQrToken: { type: String, default: null },
});

applyBasePlugin(candidateProfileSchema, { tenant: true });

candidateProfileSchema.index({ skills: "text" });
candidateProfileSchema.index({ attendanceQrToken: 1 }, { unique: true, sparse: true });

export type CandidateProfileDoc = InferSchemaType<typeof candidateProfileSchema>;
export const CandidateProfile = model("CandidateProfile", candidateProfileSchema, "candidate_profiles");
