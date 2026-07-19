import { Schema, model, type InferSchemaType } from "mongoose";

// projectId is nullable here (null = platform-wide default) so it is
// modeled explicitly rather than through the tenant base plugin, which requires it.
const systemSettingSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: String,
  },
  { timestamps: true },
);

systemSettingSchema.index({ projectId: 1, key: 1 }, { unique: true });

export type SystemSettingDoc = InferSchemaType<typeof systemSettingSchema>;
export const SystemSetting = model("SystemSetting", systemSettingSchema, "system_settings");
