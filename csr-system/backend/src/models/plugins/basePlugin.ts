import { Schema } from "mongoose";

interface BasePluginOptions {
  /** Adds a required, indexed `projectId` ref. Omit for global/system collections. */
  tenant?: boolean;
}

/**
 * Common/Audit Fields Block (CAB) — see design doc Part 01.
 * Applied to every tenant-scoped collection so soft delete, audit trail,
 * and future migrations don't need to be reinvented per-model.
 */
export function applyBasePlugin(schema: Schema, options: BasePluginOptions = {}): void {
  const fields: Record<string, unknown> = {
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    schemaVersion: { type: Number, default: 1 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  };

  if (options.tenant) {
    fields.projectId = {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    };
  }

  // Dynamic field injection inherently defeats static schema typing — contained
  // to this one cast; every model's exported *Attrs/*Doc type documents the
  // resulting shape by hand where callers need it (see e.g. models/User.ts).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema.add(fields as any);
  schema.set("timestamps", true);

  schema.index({ isDeleted: 1 });

  const softDeleteFilter = { isDeleted: { $ne: true } };

  function shouldBypass(this: { getOptions: () => Record<string, unknown> }): boolean {
    return this.getOptions().withDeleted === true;
  }

  schema.pre(
    ["find", "findOne", "countDocuments", "findOneAndUpdate", "updateOne", "updateMany"],
    function (this: any, next) {
      if (!shouldBypass.call(this)) {
        this.where(softDeleteFilter);
      }
      next();
    },
  );

  schema.methods.softDelete = function (this: any, byUserId?: string) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (byUserId) this.updatedBy = byUserId;
    return this.save();
  };
}
