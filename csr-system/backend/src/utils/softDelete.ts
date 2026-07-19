import type { Model } from "mongoose";

/**
 * Soft-deletes via findOneAndUpdate rather than the plugin's `.softDelete()`
 * instance method — sidesteps needing every one of the 31 models to carry
 * explicit Mongoose method generics (see models/User.ts for the one place
 * that does, because auth code needs it there).
 */
export function softDeleteById<T>(model: Model<T>, id: string, extraFilter: Record<string, unknown>, deletedBy: string) {
  return model.findOneAndUpdate(
    { _id: id, ...extraFilter },
    { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: deletedBy } },
    { new: true },
  );
}
