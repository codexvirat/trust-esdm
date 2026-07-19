import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import bcrypt from "bcryptjs";
import { applyBasePlugin } from "./plugins/basePlugin";
import { ROLE_CODES, USER_STATUSES, type RoleCode, type UserStatus } from "../types/enums";
import type { PermissionCode } from "../types/permissions";

export interface UserAttrs {
  projectId: Schema.Types.ObjectId;
  roleId: Schema.Types.ObjectId;
  roleCode: RoleCode;
  fullName: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  mustChangePassword: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: UserStatus;
  lastLoginAt?: Date | null;
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  avatarMediaId?: Schema.Types.ObjectId | null;
  permissionOverrides: { grant: PermissionCode[]; revoke: PermissionCode[] };
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  /** Added by applyBasePlugin — see models/plugins/basePlugin.ts */
  softDelete(byUserId?: string): Promise<HydratedDocument<UserAttrs>>;
}

type UserModel = Model<UserAttrs, object, UserMethods>;

const userSchema = new Schema<UserAttrs, UserModel, UserMethods>({
  roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
  roleCode: { type: String, enum: ROLE_CODES, required: true, index: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  // No `default: null` here on purpose: a sparse unique index only excludes
  // documents where the field is entirely *absent*, not ones explicitly set to
  // null — an explicit default would make every phone-less user collide.
  phone: String,
  passwordHash: { type: String, required: true, select: false },
  mustChangePassword: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  status: { type: String, enum: USER_STATUSES, default: "active", index: true },
  lastLoginAt: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  avatarMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  permissionOverrides: {
    grant: { type: [String], default: [] },
    revoke: { type: [String], default: [] },
  },
});

applyBasePlugin(userSchema, { tenant: true });

// Defense in depth: `select: false` only suppresses passwordHash on *queries*
// (find/findOne/...). A document fresh off `.create()` still carries it in
// memory, so res.json() on a just-created user would otherwise leak the bcrypt
// hash. Stripping it here in toJSON covers every serialization path, not just
// the ones a developer remembers to .select() carefully.
userSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.index({ projectId: 1, email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 });
userSchema.index({ projectId: 1, roleCode: 1, status: 1 });

userSchema.methods.comparePassword = async function (this: HydratedDocument<UserAttrs>, candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = model<UserAttrs, UserModel>("User", userSchema, "users");
