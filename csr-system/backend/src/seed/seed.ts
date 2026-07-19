import "../models";
import { connectDB, disconnectDB } from "../config/db";
import { env } from "../config/env";
import { Permission } from "../models/Permission";
import { Role } from "../models/Role";
import { Project } from "../models/Project";
import { User } from "../models/User";
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS } from "../types/permissions";
import { ROLE_CODES } from "../types/enums";
import { hashPassword } from "../utils/password";

async function seedPermissions() {
  for (const perm of PERMISSION_CATALOG) {
    // eslint-disable-next-line no-await-in-loop
    await Permission.findOneAndUpdate({ code: perm.code }, perm, { upsert: true, new: true });
  }
  console.log(`[seed] permissions: ${PERMISSION_CATALOG.length} upserted`);
}

async function seedSystemRoles(): Promise<Record<string, string>> {
  const roleIdByCode: Record<string, string> = {};
  for (const code of ROLE_CODES) {
    // eslint-disable-next-line no-await-in-loop
    const role = await Role.findOneAndUpdate(
      { projectId: null, code: code.toUpperCase() },
      {
        projectId: null,
        code: code.toUpperCase(),
        name: code
          .split("_")
          .map((w) => w[0]!.toUpperCase() + w.slice(1))
          .join(" "),
        isSystemRole: true,
        permissions: DEFAULT_ROLE_PERMISSIONS[code],
      },
      { upsert: true, new: true },
    );
    roleIdByCode[code] = role.id;
  }
  console.log(`[seed] system roles: ${ROLE_CODES.length} upserted`);
  return roleIdByCode;
}

async function seedPlatformProjectAndSuperAdmin(superAdminRoleId: string) {
  const project = await Project.findOneAndUpdate(
    { slug: env.SEED_PROJECT_SLUG },
    {
      name: env.SEED_PROJECT_NAME,
      slug: env.SEED_PROJECT_SLUG,
      type: "other",
      website: env.SEED_PROJECT_WEBSITE,
      contactEmail: env.SEED_SUPER_ADMIN_EMAIL ?? "admin@example.com",
      status: "active",
    },
    { upsert: true, new: true },
  );
  console.log(`[seed] platform project: ${project.slug}`);

  if (!env.SEED_SUPER_ADMIN_EMAIL || !env.SEED_SUPER_ADMIN_PASSWORD) {
    console.log("[seed] SEED_SUPER_ADMIN_EMAIL/PASSWORD not set — skipping super admin bootstrap");
    return;
  }

  const existingSuperAdmin = await User.findOne({ projectId: project._id, roleCode: "super_admin" });
  if (existingSuperAdmin) {
    console.log(`[seed] super admin already exists: ${existingSuperAdmin.email}`);
    return;
  }

  const superAdmin = await User.create({
    projectId: project._id,
    roleId: superAdminRoleId,
    roleCode: "super_admin",
    fullName: "Platform Super Admin",
    email: env.SEED_SUPER_ADMIN_EMAIL.toLowerCase(),
    passwordHash: await hashPassword(env.SEED_SUPER_ADMIN_PASSWORD),
    mustChangePassword: true,
    status: "active",
  });
  console.log(`[seed] super admin created: ${superAdmin.email} (temporary password from .env — change on first login)`);
}

async function main() {
  await connectDB();
  await seedPermissions();
  const roleIdByCode = await seedSystemRoles();
  await seedPlatformProjectAndSuperAdmin(roleIdByCode.super_admin!);
  await disconnectDB();
  console.log("[seed] done");
}

main().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
