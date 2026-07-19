import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";

const roleSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  description: String,
  isSystemRole: { type: Boolean, default: false },
  permissions: { type: [String], required: true, default: [] },
});

// Not tenant-scoped via the plugin: projectId is nullable here (null = system role),
// unlike every other collection where it's required — see field def above.
applyBasePlugin(roleSchema);

roleSchema.index({ projectId: 1, code: 1 }, { unique: true });

export type RoleDoc = InferSchemaType<typeof roleSchema>;
export const Role = model("Role", roleSchema, "roles");
