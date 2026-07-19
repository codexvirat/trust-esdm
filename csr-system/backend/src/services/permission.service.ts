import { Role } from "../models/Role";
import type { UserAttrs } from "../models/User";
import type { PermissionCode } from "../types/permissions";

/**
 * Effective permissions = role's base grants, plus per-user overrides
 * (grant/revoke) — see design doc Part 01. Computed once at login/refresh
 * and embedded in the short-lived access token, rather than re-joined on
 * every request.
 */
export async function resolveEffectivePermissions(user: Pick<UserAttrs, "roleId" | "permissionOverrides">): Promise<PermissionCode[]> {
  const role = await Role.findById(user.roleId).lean();
  const base = new Set<PermissionCode>((role?.permissions ?? []) as PermissionCode[]);

  for (const granted of user.permissionOverrides?.grant ?? []) base.add(granted);
  for (const revoked of user.permissionOverrides?.revoke ?? []) base.delete(revoked);

  return Array.from(base);
}
