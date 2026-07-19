import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { RoleCode } from "../types/enums";
import type { PermissionCode } from "../types/permissions";

export interface AccessTokenPayload {
  sub: string; // userId
  projectId: string;
  roleCode: RoleCode;
  permissions: PermissionCode[];
}

export interface RefreshTokenPayload {
  sub: string; // userId
  sid: string; // AuthSession _id
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions["expiresIn"] });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
