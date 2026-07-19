/* eslint-disable no-console */
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  process.env.JWT_ACCESS_TTL = "15m";
  process.env.JWT_REFRESH_TTL = "30d";
  process.env.PORT = "0";
  process.env.CORS_ORIGINS = "http://localhost:3000";

  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("csr_http_smoke");

  const mongoose = (await import("mongoose")).default;
  await import("../src/models");
  const { connectDB, disconnectDB } = await import("../src/config/db");
  await connectDB();
  await Promise.all(Object.values(mongoose.connection.models).map((m) => m.init()));

  const { Permission } = await import("../src/models/Permission");
  const { Role } = await import("../src/models/Role");
  const { Project } = await import("../src/models/Project");
  const { User } = await import("../src/models/User");
  const { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } = await import("../src/types/permissions");
  const { ROLE_CODES } = await import("../src/types/enums");
  const { hashPassword } = await import("../src/utils/password");

  await Promise.all(PERMISSION_CATALOG.map((p) => Permission.create(p)));
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

  const project = await Project.create({
    name: "Platform Project",
    slug: "platform",
    type: "other",
    contactEmail: "admin@example.com",
    status: "active",
  });

  const superAdmin = await User.create({
    projectId: project._id,
    roleId: roleIdByCode.super_admin,
    roleCode: "super_admin",
    fullName: "Platform Super Admin",
    email: "admin@example.com",
    passwordHash: await hashPassword("ChangeMe123!"),
    mustChangePassword: true,
    status: "active",
  });
  void superAdmin;

  const { createApp } = await import("../src/app");
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;
  console.log(`[http-smoke] server listening on ${base}`);

  const results: { name: string; pass: boolean; detail?: unknown }[] = [];
  const check = (name: string, pass: boolean, detail?: unknown) => {
    results.push({ name, pass, detail });
    console.log(`[http-smoke] ${pass ? "PASS" : "FAIL"} — ${name}${detail ? " " + JSON.stringify(detail) : ""}`);
  };

  // 1. Health check
  const health = await fetch(`${base}/health`);
  check("GET /health -> 200", health.status === 200);

  // 2. Login with wrong password -> 401
  const badLogin = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "wrong-password" }),
  });
  check("wrong password -> 401", badLogin.status === 401);

  // 3. Unauthenticated protected route -> 401
  const noAuth = await fetch(`${base}/api/v1/me`);
  check("GET /me without token -> 401", noAuth.status === 401);

  // 4. Correct login -> 200 with tokens + mustChangePassword
  const loginRes = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "ChangeMe123!" }),
  });
  const loginBody = (await loginRes.json()) as { accessToken: string; refreshToken: string; mustChangePassword: boolean };
  check("correct password -> 200 with tokens", loginRes.status === 200 && Boolean(loginBody.accessToken) && Boolean(loginBody.refreshToken));
  check("mustChangePassword surfaced as true", loginBody.mustChangePassword === true);

  // 5. Authenticated /me works and reflects role
  const meRes = await fetch(`${base}/api/v1/me`, { headers: { Authorization: `Bearer ${loginBody.accessToken}` } });
  const meBody = (await meRes.json()) as { user: { roleCode: string; email: string } };
  check("GET /me with token -> 200, correct role", meRes.status === 200 && meBody.user.roleCode === "super_admin" && meBody.user.email === "admin@example.com");

  // 6. RBAC: super_admin can create an project (requires PROJECT_MANAGE)
  const createOrgRes = await fetch(`${base}/api/v1/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${loginBody.accessToken}` },
    body: JSON.stringify({ name: "Acme University", slug: "acme-university", type: "university", contactEmail: "contact@acme.edu" }),
  });
  check("super_admin POST /projects -> 201", createOrgRes.status === 201);

  // 7. RBAC: create a manager, whose token must NOT be able to create projects
  const createManagerRes = await fetch(`${base}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${loginBody.accessToken}` },
    body: JSON.stringify({ roleCode: "manager", fullName: "Test Manager", email: "manager@example.com" }),
  });
  if (createManagerRes.status !== 201) console.log("[http-smoke] debug body:", await createManagerRes.clone().text());
  check("super_admin POST /users (manager) -> 201", createManagerRes.status === 201);

  const managerUser = await User.findOne({ email: "manager@example.com" }).select("+passwordHash");
  check("manager account created with mustChangePassword", Boolean(managerUser?.mustChangePassword));

  // Manager's temp password isn't retrievable via the API (by design — it only went out
  // through the notification stub), so exercise RBAC directly against a manager access token
  // minted the same way login() would, to prove requirePermission actually blocks PROJECT_MANAGE.
  const { signAccessToken } = await import("../src/utils/jwt");
  const managerToken = signAccessToken({
    sub: managerUser!.id,
    projectId: project.id,
    roleCode: "manager",
    permissions: DEFAULT_ROLE_PERMISSIONS.manager,
  });
  check("manager token lacks PROJECT_MANAGE", !DEFAULT_ROLE_PERMISSIONS.manager.includes(PERMISSIONS.PROJECT_MANAGE));

  const managerCreateOrgRes = await fetch(`${base}/api/v1/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ name: "Should Fail Project", slug: "should-fail", type: "university", contactEmail: "x@x.com" }),
  });
  check("manager POST /projects -> 403 (RBAC blocks)", managerCreateOrgRes.status === 403);

  const managerCreateManagerRes = await fetch(`${base}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ roleCode: "super_admin", fullName: "Escalation Attempt", email: "escalate@example.com" }),
  });
  check("manager cannot create a super_admin -> 403", managerCreateManagerRes.status === 403);

  // 8. Refresh token flow
  const refreshRes = await fetch(`${base}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: loginBody.refreshToken }),
  });
  const refreshBody = (await refreshRes.json()) as { accessToken: string; refreshToken: string };
  check("refresh -> 200 with new tokens", refreshRes.status === 200 && Boolean(refreshBody.accessToken));

  // Old refresh token must be revoked after rotation
  const reuseOldRefresh = await fetch(`${base}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: loginBody.refreshToken }),
  });
  check("reusing rotated-out refresh token -> 401", reuseOldRefresh.status === 401);

  // 9. Change password with wrong current password -> 400
  const badChange = await fetch(`${base}/api/v1/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${refreshBody.accessToken}` },
    body: JSON.stringify({ currentPassword: "not-the-password", newPassword: "NewPassword123!" }),
  });
  check("change-password wrong current -> 400", badChange.status === 400);

  server.close();
  await disconnectDB();
  await mongod.stop();

  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.error(`[http-smoke] ${failed.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log(`[http-smoke] ALL ${results.length} CHECKS PASSED`);
}

main().catch((err) => {
  console.error("[http-smoke] FAILED", err);
  process.exit(1);
});
