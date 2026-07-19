import { Schema, model, type InferSchemaType } from "mongoose";

// Global master catalog — deliberately excludes the base plugin: it has no
// tenant scope, no soft delete (permissions are code-defined, not user-managed),
// and is written once by the seed script.
const permissionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    module: { type: String, required: true, index: true },
    description: { type: String, required: true },
  },
  { timestamps: true },
);

export type PermissionDoc = InferSchemaType<typeof permissionSchema>;
export const Permission = model("Permission", permissionSchema, "permissions");
