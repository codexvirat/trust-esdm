import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "../config/env";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Random password generated for auto-created candidate accounts on registration approval. */
export function generateTemporaryPassword(): string {
  const symbols = "!@#$%*";
  const random = crypto.randomBytes(9).toString("base64url");
  const symbol = symbols[crypto.randomInt(symbols.length)];
  return `${random}${symbol}${crypto.randomInt(10)}`;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
