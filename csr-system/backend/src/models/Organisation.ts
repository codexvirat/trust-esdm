import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { PROJECT_TYPES } from "../types/enums";

/**
 * Staff-curated master list of candidate-affiliated companies/organisations —
 * created once by Admin/Manager so the public registration form can offer a
 * "select your company" dropdown instead of every candidate re-typing the
 * same employer details. See Registration.affiliatedOrganisation /
 * CandidateProfile.affiliatedOrganisation, which still store a point-in-time
 * snapshot of these fields (same pattern as Batch.venue snapshotting Venue).
 */
const organisationSchema = new Schema({
  name: { type: String, required: true, trim: true },
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
  // Only one of these is meaningful at a time, depending on `type`: cin for
  // type "company" (Corporate Identification Number), udyamNumber for type
  // "msme" (Udyam Registration Number).
  cin: String,
  udyamNumber: String,
  shortCode: String,
  industry: String,
  employeeCount: Number,
  establishedDate: Date,
  isActive: { type: Boolean, default: true },
});

applyBasePlugin(organisationSchema, { tenant: true });

organisationSchema.index({ projectId: 1, name: 1 });

export type OrganisationDoc = InferSchemaType<typeof organisationSchema>;
export const Organisation = model("Organisation", organisationSchema, "organisations");
