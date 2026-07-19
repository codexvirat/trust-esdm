import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CORS_ORIGINS: z.string().default(""),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  SEED_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_PROJECT_NAME: z.string().default("Platform Project"),
  SEED_PROJECT_SLUG: z.string().default("platform"),
  SEED_PROJECT_WEBSITE: z.string().optional(),
  // Resend for real outbound email (welcome/enrollment mail with QR badge).
  // Optional: if unset, emails are logged to the Notification collection only
  // (see services/email.service.ts) so local dev works without credentials.
  RESEND_API_KEY: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  EMAIL_FROM_ADDRESS: z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional()),
  EMAIL_FROM_NAME: z.string().default("CSR Training Platform"),
  WEBSITE_URL: z.string().default("http://localhost:3000"),
  CANDIDATE_PORTAL_URL: z.string().default("http://localhost:3004"),
  ADMIN_PORTAL_URL: z.string().default("http://localhost:3001"),
  MANAGER_PORTAL_URL: z.string().default("http://localhost:3002"),
  TRAINER_PORTAL_URL: z.string().default("http://localhost:3003"),
  ORG_ADMIN_PORTAL_URL: z.string().default("http://localhost:3005"),
  WORKSHOP_MANAGER_PORTAL_URL: z.string().default("http://localhost:3006"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — check .env against .env.example");
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  corsOrigins: parsed.data.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
