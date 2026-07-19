/* eslint-disable no-console */
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  process.env.MONGODB_URI = "placeholder";
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  process.env.SEED_SUPER_ADMIN_EMAIL = "admin@example.com";
  process.env.SEED_SUPER_ADMIN_PASSWORD = "ChangeMe123!";
  process.env.SEED_PROJECT_SLUG = "platform";
  process.env.SEED_PROJECT_NAME = "Platform Project";

  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("csr_smoke_test");

  const { connectDB, disconnectDB } = await import("../src/config/db");
  const mongoose = (await import("mongoose")).default;
  await import("../src/models");
  await connectDB();
  // Unique-index enforcement (projectId+email, certificate partial-unique, etc.)
  // requires the indexes to actually be built first — connect() alone doesn't wait for that.
  await Promise.all(Object.values(mongoose.connection.models).map((m) => m.init()));
  console.log("[smoke] connected to in-memory mongo, indexes built");

  const { Permission } = await import("../src/models/Permission");
  const { Role } = await import("../src/models/Role");
  const { Project } = await import("../src/models/Project");
  const { User } = await import("../src/models/User");
  const { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS } = await import("../src/types/permissions");
  const { ROLE_CODES } = await import("../src/types/enums");
  const { hashPassword, verifyPassword } = await import("../src/utils/password");

  for (const perm of PERMISSION_CATALOG) {
    await Permission.create(perm);
  }
  console.log(`[smoke] inserted ${PERMISSION_CATALOG.length} permissions`);

  const roleIdByCode: Record<string, string> = {};
  for (const code of ROLE_CODES) {
    const role = await Role.create({
      projectId: null,
      code: code.toUpperCase(),
      name: code,
      isSystemRole: true,
      permissions: DEFAULT_ROLE_PERMISSIONS[code],
    });
    roleIdByCode[code] = role.id;
  }
  console.log(`[smoke] inserted ${ROLE_CODES.length} system roles`);

  const project = await Project.create({
    name: "Platform Project",
    slug: "platform",
    type: "other",
    contactEmail: "admin@example.com",
    status: "active",
  });
  console.log(`[smoke] created project ${project.slug}`);

  const passwordHash = await hashPassword("ChangeMe123!");
  const admin = await User.create({
    projectId: project._id,
    roleId: roleIdByCode.super_admin,
    roleCode: "super_admin",
    fullName: "Platform Super Admin",
    email: "admin@example.com",
    passwordHash,
    mustChangePassword: true,
    status: "active",
  });
  console.log(`[smoke] created super admin ${admin.email}`);

  const found = await User.findOne({ projectId: project._id, email: "admin@example.com" }).select("+passwordHash");
  if (!found) throw new Error("user not found after create");
  const passOk = await verifyPassword("ChangeMe123!", found.passwordHash);
  const passBad = await verifyPassword("WrongPassword!", found.passwordHash);
  console.log(`[smoke] password check correct=${passOk} wrong=${passBad}`);
  if (!passOk || passBad) throw new Error("password verification behaved incorrectly");

  // Duplicate email within the same project must be rejected by the unique index.
  let duplicateRejected = false;
  try {
    await User.create({
      projectId: project._id,
      roleId: roleIdByCode.candidate,
      roleCode: "candidate",
      fullName: "Duplicate",
      email: "admin@example.com",
      passwordHash,
      status: "active",
    });
  } catch (err) {
    duplicateRejected = (err as { code?: number }).code === 11000;
  }
  console.log(`[smoke] duplicate email correctly rejected=${duplicateRejected}`);
  if (!duplicateRejected) throw new Error("expected duplicate (projectId,email) to be rejected");

  // Soft delete should hide the document from default finds.
  await found.softDelete();
  const afterDelete = await User.findOne({ projectId: project._id, email: "admin@example.com" });
  const stillVisibleWithFlag = await User.findOne({ projectId: project._id, email: "admin@example.com" }, null, { withDeleted: true });
  console.log(`[smoke] soft-deleted user hidden by default=${afterDelete === null} still reachable withDeleted=${stillVisibleWithFlag !== null}`);
  if (afterDelete !== null || stillVisibleWithFlag === null) throw new Error("soft delete filtering behaved incorrectly");

  // Certificate partial-unique index: two 'issued' certs for the same enrollment must collide,
  // but a 'revoked' one must not block a fresh 'issued' one (Part 08 design fix).
  const { Certificate } = await import("../src/models/Certificate");
  const enrollmentId = new mongoose.Types.ObjectId();
  const common = {
    projectId: project._id,
    candidateUserId: admin._id,
    workshopId: new mongoose.Types.ObjectId(),
    batchId: new mongoose.Types.ObjectId(),
    templateId: new mongoose.Types.ObjectId(),
  };
  const cert1 = await Certificate.create({ ...common, enrollmentId, certificateNumber: "CERT-0001", verificationCode: "VERIFY-0001", status: "issued" });
  let secondIssuedRejected = false;
  try {
    await Certificate.create({ ...common, enrollmentId, certificateNumber: "CERT-0002", verificationCode: "VERIFY-0002", status: "issued" });
  } catch (err) {
    secondIssuedRejected = (err as { code?: number }).code === 11000;
  }
  cert1.status = "revoked";
  await cert1.save();
  const reissue = await Certificate.create({ ...common, enrollmentId, certificateNumber: "CERT-0003", verificationCode: "VERIFY-0003", status: "issued" });
  console.log(`[smoke] blocks second concurrent 'issued' cert=${secondIssuedRejected}, allows reissue after revoke=${Boolean(reissue)}`);
  if (!secondIssuedRejected || !reissue) throw new Error("certificate partial-unique index behaved incorrectly");

  await disconnectDB();
  await mongod.stop();
  console.log("[smoke] ALL CHECKS PASSED");
}

main().catch((err) => {
  console.error("[smoke] FAILED", err);
  process.exit(1);
});
