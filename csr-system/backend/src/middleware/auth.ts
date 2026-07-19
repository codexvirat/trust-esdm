import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import type { PermissionCode } from "../types/permissions";
import type { RoleCode } from "../types/enums";

/** Populates req.user from the Bearer access token. Throws 401 if missing/invalid. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing bearer token");
  }

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.user = {
      userId: payload.sub,
      projectId: payload.projectId,
      roleCode: payload.roleCode,
      permissions: payload.permissions,
    };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

/** Allows the request through only if the authenticated user holds every listed permission. */
export function requirePermission(...codes: PermissionCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized();
    const missing = codes.filter((code) => !req.user!.permissions.includes(code));
    if (missing.length > 0) {
      throw ApiError.forbidden(`Missing required permission(s): ${missing.join(", ")}`);
    }
    next();
  };
}

/** Allows the request through only if the authenticated user has one of the listed roles. */
export function requireRole(...roles: RoleCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.roleCode)) {
      throw ApiError.forbidden(`Requires role: ${roles.join(" or ")}`);
    }
    next();
  };
}
