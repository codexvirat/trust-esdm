import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { GENDERS, REGISTRATION_SOURCES, REGISTRATION_STATUSES, BLOOD_GROUPS, PROJECT_TYPES } from "../types/enums";

const addressSchema = new Schema(
  { line1: String, line2: String, city: String, state: String, country: String, pincode: String },
  { _id: false },
);

// Mirrors CandidateProfile's affiliatedOrganisation shape — captured at
// application time so it can be copied straight over when the registration
// is approved and a CandidateProfile gets created (see registration.service.ts).
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

const statusHistoryEntrySchema = new Schema(
  {
    status: { type: String, enum: REGISTRATION_STATUSES, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    changedAt: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false },
);

const registrationSchema = new Schema({
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  dob: Date,
  gender: { type: String, enum: GENDERS },
  bloodGroup: { type: String, enum: BLOOD_GROUPS },
  alternatePhone: String,
  address: addressSchema,
  // If set, affiliatedOrganisation below is a server-populated snapshot of this Organisation
  // record at application time (see registration.service.ts#applyForWorkshop) — never trust
  // client-submitted affiliatedOrganisation fields when organisationId is present.
  organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", default: null },
  affiliatedOrganisation: affiliatedOrganisationSchema,
  educationSnapshot: { type: Schema.Types.Mixed, default: [] },
  skillsSnapshot: { type: [String], default: [] },
  resumeMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  source: { type: String, enum: REGISTRATION_SOURCES, default: "website" },
  status: { type: String, enum: REGISTRATION_STATUSES, default: "pending", index: true },
  reviewedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: String,
  convertedUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  statusHistory: { type: [statusHistoryEntrySchema], default: [] },
});

applyBasePlugin(registrationSchema, { tenant: true });

registrationSchema.index({ projectId: 1, workshopId: 1, status: 1, createdAt: 1 });
registrationSchema.index({ email: 1 });
registrationSchema.index({ workshopId: 1, email: 1 }, { unique: true });

export type RegistrationDoc = InferSchemaType<typeof registrationSchema>;
export const Registration = model("Registration", registrationSchema, "registrations");
