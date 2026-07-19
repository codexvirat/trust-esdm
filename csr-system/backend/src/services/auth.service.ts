import { User, type UserAttrs } from "../models/User";
import { Project } from "../models/Project";
import { AuthSession } from "../models/AuthSession";
import { ApiError } from "../utils/ApiError";
import { verifyPassword, hashPassword, hashToken, generateRawToken } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { parseDurationToMs } from "../utils/duration";
import { resolveEffectivePermissions } from "./permission.service";
import { env } from "../config/env";
import type { HydratedDocument } from "mongoose";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60_000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(
  user: HydratedDocument<UserAttrs>,
  meta: { ipAddress?: string | null; userAgent?: string | null; deviceInfo?: string | null },
): Promise<TokenPair> {
  const permissions = await resolveEffectivePermissions(user);

  const accessToken = signAccessToken({
    sub: user.id,
    projectId: user.projectId.toString(),
    roleCode: user.roleCode,
    permissions,
  });

  // Placeholder hash first so the session has an _id to embed in the refresh JWT;
  // the real hash (of the signed token itself) is written right after.
  const session = await AuthSession.create({
    userId: user._id,
    refreshTokenHash: generateRawToken(),
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    deviceInfo: meta.deviceInfo,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL)),
  });

  const refreshToken = signRefreshToken({ sub: user.id, sid: session.id });
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  return { accessToken, refreshToken };
}

export async function login(input: {
  email: string;
  password: string;
  projectSlug?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<TokenPair & { mustChangePassword: boolean }> {
  const email = input.email.trim().toLowerCase();

  let candidates: HydratedDocument<UserAttrs>[];
  if (input.projectSlug) {
    const project = await Project.findOne({ slug: input.projectSlug.toLowerCase() });
    if (!project) throw ApiError.unauthorized("Invalid credentials");
    const user = await User.findOne({ projectId: project._id, email }).select("+passwordHash");
    candidates = user ? [user] : [];
  } else {
    candidates = await User.find({ email }).select("+passwordHash");
  }

  const now = new Date();
  const matches: HydratedDocument<UserAttrs>[] = [];
  for (const candidate of candidates) {
    if (candidate.lockedUntil && candidate.lockedUntil > now) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await verifyPassword(input.password, candidate.passwordHash)) matches.push(candidate);
  }

  if (matches.length === 0) {
    if (candidates.length === 1) {
      const only = candidates[0]!;
      only.failedLoginAttempts += 1;
      if (only.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        only.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await only.save();
    }
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (matches.length > 1) {
    throw ApiError.conflict("This email is used at multiple projects — specify projectSlug", {
      requiresProjectSlug: true,
    });
  }

  const user = matches[0]!;
  if (user.status !== "active") {
    throw ApiError.forbidden(`Account is ${user.status}`);
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, { ipAddress: input.ipAddress, userAgent: input.userAgent });
  return { ...tokens, mustChangePassword: user.mustChangePassword };
}

export async function refresh(input: { refreshToken: string }): Promise<TokenPair> {
  let payload;
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const session = await AuthSession.findById(payload.sid);
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw ApiError.unauthorized("Session expired or revoked");
  }
  if (session.refreshTokenHash !== hashToken(input.refreshToken)) {
    throw ApiError.unauthorized("Refresh token does not match active session");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active") {
    throw ApiError.unauthorized("Account no longer active");
  }

  // Rotate: revoke the session backing this refresh token and issue a fresh pair.
  session.revokedAt = new Date();
  await session.save();

  return issueTokenPair(user, { ipAddress: session.ipAddress, userAgent: session.userAgent, deviceInfo: session.deviceInfo });
}

export async function logout(input: { refreshToken: string }): Promise<void> {
  try {
    const payload = verifyRefreshToken(input.refreshToken);
    await AuthSession.findByIdAndUpdate(payload.sid, { revokedAt: new Date() });
  } catch {
    // Already invalid/expired — logout is idempotent either way.
  }
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await AuthSession.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw ApiError.notFound("User not found");

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest("Current password is incorrect");

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  await logoutAllDevices(userId);
}
