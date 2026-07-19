/* eslint-disable no-console */
import { MongoMemoryReplSet } from "mongodb-memory-server";

async function main() {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  process.env.JWT_ACCESS_TTL = "15m";
  process.env.JWT_REFRESH_TTL = "30d";
  process.env.PORT = "0";
  process.env.CORS_ORIGINS = "http://localhost:3000";

  // Transactions require a replica set — a standalone mongod (used in the
  // earlier smoke tests) can't run session.withTransaction().
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri("csr_http_smoke_2");

  const mongoose = (await import("mongoose")).default;
  await import("../src/models");
  const { connectDB, disconnectDB } = await import("../src/config/db");
  await connectDB();
  await Promise.all(Object.values(mongoose.connection.models).map((m) => m.init()));

  const { Permission } = await import("../src/models/Permission");
  const { Role } = await import("../src/models/Role");
  const { Project } = await import("../src/models/Project");
  const { User } = await import("../src/models/User");
  const { Registration } = await import("../src/models/Registration");
  const { Enrollment } = await import("../src/models/Enrollment");
  const { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS } = await import("../src/types/permissions");
  const { ROLE_CODES } = await import("../src/types/enums");
  const { hashPassword } = await import("../src/utils/password");
  const { signAccessToken } = await import("../src/utils/jwt");

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
    name: "Acme University",
    slug: "acme-university",
    type: "university",
    contactEmail: "admin@acme.edu",
    status: "active",
  });

  const superAdmin = await User.create({
    projectId: project._id,
    roleId: roleIdByCode.super_admin,
    roleCode: "super_admin",
    fullName: "Super Admin",
    email: "admin@acme.edu",
    passwordHash: await hashPassword("ChangeMe123!"),
    status: "active",
  });
  const adminToken = signAccessToken({
    sub: superAdmin.id,
    projectId: project.id,
    roleCode: "super_admin",
    permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
  });

  const { createApp } = await import("../src/app");
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;
  console.log(`[flow] server listening on ${base}`);

  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: boolean, detail?: unknown) => {
    results.push({ name, pass });
    console.log(`[flow] ${pass ? "PASS" : "FAIL"} — ${name}${detail !== undefined ? " " + JSON.stringify(detail) : ""}`);
  };
  const authed = (token: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

  // --- Manager setup ---
  const createManagerRes = await fetch(`${base}/api/v1/users`, {
    method: "POST",
    headers: authed(adminToken),
    body: JSON.stringify({ roleCode: "manager", fullName: "Test Manager", email: "manager@acme.edu" }),
  });
  const managerBody = (await createManagerRes.json()) as { _id: string };
  const managerToken = signAccessToken({
    sub: managerBody._id,
    projectId: project.id,
    roleCode: "manager",
    permissions: DEFAULT_ROLE_PERMISSIONS.manager,
  });
  check("create manager -> 201", createManagerRes.status === 201);

  // --- Workshop lifecycle ---
  const createEventRes = await fetch(`${base}/api/v1/workshops`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({
      title: "Digital Literacy Bootcamp",
      slug: "digital-literacy-bootcamp",
      description: "A hands-on introduction to digital skills for community members.",
      type: "bootcamp",
      mode: "offline",
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      capacity: 50,
      // Lowered so the 67% attendance the candidate ends up with later in this
      // script clears the bar — lets the certificate section isolate the
      // assessment/feedback gates instead of also being blocked on attendance.
      certificateSettings: { minAttendancePercent: 50 },
    }),
  });
  const workshop = (await createEventRes.json()) as { _id: string; slug: string; status: string };
  check("manager creates workshop -> 201, status draft", createEventRes.status === 201 && workshop.status === "draft");

  const publishRes = await fetch(`${base}/api/v1/workshops/${workshop._id}/status`, {
    method: "PATCH",
    headers: authed(managerToken),
    body: JSON.stringify({ status: "published" }),
  });
  check("manager publishes workshop -> 200", publishRes.status === 200 && (await publishRes.json()).status === "published");

  const createBatchRes = await fetch(`${base}/api/v1/workshops/${workshop._id}/batches`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ code: "BATCH-A", name: "Batch A — Mumbai", startDate: "2026-08-01", endDate: "2026-08-05", capacity: 30 }),
  });
  const batch = (await createBatchRes.json()) as { _id: string };
  check("manager creates batch -> 201", createBatchRes.status === 201);

  // Trainer create + assignment
  const createTrainerRes = await fetch(`${base}/api/v1/users`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ roleCode: "trainer", fullName: "Test Trainer", email: "trainer@acme.edu" }),
  });
  const trainer = (await createTrainerRes.json()) as { _id: string };
  check("manager creates trainer -> 201", createTrainerRes.status === 201);

  const assignRes = await fetch(`${base}/api/v1/workshops/${workshop._id}/batches/${batch._id}/trainer-assignments`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ trainerId: trainer._id, roleInBatch: "lead" }),
  });
  check("manager assigns trainer to batch -> 201", assignRes.status === 201);

  // Trainer RBAC: cannot create workshops, can view them
  const trainerToken = signAccessToken({
    sub: trainer._id,
    projectId: project.id,
    roleCode: "trainer",
    permissions: DEFAULT_ROLE_PERMISSIONS.trainer,
  });
  const trainerCreateEventRes = await fetch(`${base}/api/v1/workshops`, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ title: "x", slug: "x", description: "x".repeat(10), type: "workshop", mode: "online", startDate: "2026-01-01", endDate: "2026-01-02" }),
  });
  check("trainer cannot create workshops -> 403", trainerCreateEventRes.status === 403);
  const trainerViewEventsRes = await fetch(`${base}/api/v1/workshops`, { headers: authed(trainerToken) });
  check("trainer can view workshops -> 200", trainerViewEventsRes.status === 200);

  // --- Public site: browse + apply ---
  const publicListRes = await fetch(`${base}/api/v1/public/${project.slug}/workshops`);
  const publicList = (await publicListRes.json()) as { items: { slug: string }[]; total: number };
  check("public workshop listing includes published workshop", publicListRes.status === 200 && publicList.items.some((e) => e.slug === workshop.slug));

  const publicGetRes = await fetch(`${base}/api/v1/public/${project.slug}/workshops/${workshop.slug}`);
  check("public can fetch workshop by slug -> 200", publicGetRes.status === 200);

  const applyRes = await fetch(`${base}/api/v1/public/${project.slug}/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workshopId: workshop._id, fullName: "Priya Sharma", email: "priya@example.com", phone: "9876543210" }),
  });
  const applyBody = (await applyRes.json()) as { registrationId: string; status: string };
  check("public applies to workshop -> 201, status pending", applyRes.status === 201 && applyBody.status === "pending");

  const duplicateApplyRes = await fetch(`${base}/api/v1/public/${project.slug}/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workshopId: workshop._id, fullName: "Priya Sharma", email: "priya@example.com", phone: "9876543210" }),
  });
  check("duplicate application to same workshop -> 409", duplicateApplyRes.status === 409);

  // --- Manager reviews the queue ---
  const pendingRes = await fetch(`${base}/api/v1/registrations?status=pending&workshopId=${workshop._id}`, { headers: authed(managerToken) });
  const pendingList = (await pendingRes.json()) as { _id: string; email: string }[];
  check("manager sees 1 pending registration", pendingRes.status === 200 && pendingList.length === 1 && pendingList[0]?.email === "priya@example.com");
  const registrationId = pendingList[0]!._id;

  // Reject path (wrong-batch-first, to also prove failed approval doesn't touch anything)
  const otherEventBatch = await Registration.db.model("Batch").create({
    projectId: project._id,
    workshopId: new mongoose.Types.ObjectId(), // a batch belonging to a DIFFERENT workshop
    code: "FOREIGN",
    name: "Foreign batch",
    startDate: new Date(),
    endDate: new Date(),
  });
  const badApproveRes = await fetch(`${base}/api/v1/registrations/${registrationId}/approve`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ batchId: otherEventBatch.id }),
  });
  check("approving with a batch from another workshop -> 400", badApproveRes.status === 400);
  const stillPending = await Registration.findById(registrationId);
  const noUserYet = await User.findOne({ projectId: project._id, email: "priya@example.com" });
  check("failed approval leaves registration pending and creates no user (rollback)", stillPending?.status === "pending" && noUserYet === null);

  // Real approval
  const approveRes = await fetch(`${base}/api/v1/registrations/${registrationId}/approve`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ batchId: batch._id }),
  });
  const approveBody = (await approveRes.json()) as { isNewUser: boolean; candidateUserId: string; enrollmentId: string };
  check("approve -> 200, creates new user + enrollment", approveRes.status === 200 && approveBody.isNewUser === true);

  const candidateUser = await User.findById(approveBody.candidateUserId).select("+passwordHash");
  check("candidate account created with mustChangePassword=true", candidateUser?.mustChangePassword === true && candidateUser?.status === "active");

  const enrollment = await Enrollment.findById(approveBody.enrollmentId);
  check("enrollment created with status=assigned", enrollment?.status === "assigned");

  const batchAfter = await Registration.db.model("Batch").findById(batch._id);
  const eventAfter = await Registration.db.model("Workshop").findById(workshop._id);
  check("batch.enrolledCount incremented to 1", (batchAfter as unknown as { enrolledCount: number }).enrolledCount === 1);
  check("workshop.enrolledCount incremented to 1", (eventAfter as unknown as { enrolledCount: number }).enrolledCount === 1);

  const reapproveRes = await fetch(`${base}/api/v1/registrations/${registrationId}/approve`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ batchId: batch._id }),
  });
  check("re-approving an already-approved registration -> 409", reapproveRes.status === 409);

  // --- Reject path with a second applicant ---
  await fetch(`${base}/api/v1/public/${project.slug}/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workshopId: workshop._id, fullName: "Rejected Person", email: "rejectme@example.com", phone: "9998887777" }),
  });
  const pendingRes2 = await fetch(`${base}/api/v1/registrations?status=pending&workshopId=${workshop._id}`, { headers: authed(managerToken) });
  const pendingList2 = (await pendingRes2.json()) as { _id: string }[];
  const rejectRes = await fetch(`${base}/api/v1/registrations/${pendingList2[0]!._id}/reject`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ reason: "Does not meet eligibility criteria" }),
  });
  const rejectBody = (await rejectRes.json()) as { status: string; rejectionReason: string };
  check("reject -> 200, status rejected with reason", rejectRes.status === 200 && rejectBody.status === "rejected" && Boolean(rejectBody.rejectionReason));

  // --- Candidate RBAC ---
  const candidateToken = signAccessToken({
    sub: approveBody.candidateUserId,
    projectId: project.id,
    roleCode: "candidate",
    permissions: DEFAULT_ROLE_PERMISSIONS.candidate,
  });
  const candidateViewRegistrationsRes = await fetch(`${base}/api/v1/registrations`, { headers: authed(candidateToken) });
  check("candidate cannot view registrations queue -> 403", candidateViewRegistrationsRes.status === 403);

  const candidateOwnEnrollmentsRes = await fetch(`${base}/api/v1/enrollments`, { headers: authed(candidateToken) });
  const candidateOwnEnrollments = (await candidateOwnEnrollmentsRes.json()) as { _id: string }[];
  check(
    "candidate sees exactly their own 1 enrollment",
    candidateOwnEnrollmentsRes.status === 200 && candidateOwnEnrollments.length === 1 && candidateOwnEnrollments[0]?._id === approveBody.enrollmentId,
  );

  const managerOrgEnrollmentsRes = await fetch(`${base}/api/v1/enrollments?batchId=${batch._id}`, { headers: authed(managerToken) });
  const managerOrgEnrollments = (await managerOrgEnrollmentsRes.json()) as unknown[];
  check("manager sees project-wide enrollments for the batch", managerOrgEnrollmentsRes.status === 200 && managerOrgEnrollments.length === 1);

  // --- Attendance / QR (staff scans the CANDIDATE's badge — candidates never self-mark) ---
  const basePath = `${base}/api/v1/workshops/${workshop._id}/batches/${batch._id}/attendance-sessions`;

  // A trainer NOT assigned to this batch must not be able to open its session.
  const createUnassignedTrainerRes = await fetch(`${base}/api/v1/users`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ roleCode: "trainer", fullName: "Unassigned Trainer", email: "outsider@acme.edu" }),
  });
  const outsiderTrainer = (await createUnassignedTrainerRes.json()) as { _id: string };
  const outsiderTrainerToken = signAccessToken({
    sub: outsiderTrainer._id,
    projectId: project.id,
    roleCode: "trainer",
    permissions: DEFAULT_ROLE_PERMISSIONS.trainer,
  });
  const outsiderGenerateRes = await fetch(basePath, {
    method: "POST",
    headers: authed(outsiderTrainerToken),
    body: JSON.stringify({ sessionDate: new Date().toISOString(), sessionLabel: "Day 1", expiresInMinutes: 60 }),
  });
  check("trainer not assigned to batch cannot open its session -> 403", outsiderGenerateRes.status === 403);

  // The assigned trainer opens Day 1's session.
  const genSession1Res = await fetch(basePath, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ sessionDate: new Date().toISOString(), sessionLabel: "Day 1", expiresInMinutes: 60 }),
  });
  const session1 = (await genSession1Res.json()) as { _id: string; status: string };
  check("assigned trainer opens Day 1 session -> 201, open", genSession1Res.status === 201 && session1.status === "open");

  // Candidate fetches their own badge from their dashboard.
  const badgeRes = await fetch(`${base}/api/v1/me/attendance-qr`, { headers: authed(candidateToken) });
  const badgeBody = (await badgeRes.json()) as { attendanceQrToken: string };
  check("candidate can fetch their own attendance badge -> 200", badgeRes.status === 200 && Boolean(badgeBody.attendanceQrToken));

  // The candidate CANNOT scan their own badge — marking is staff-only.
  const selfScanAttemptRes = await fetch(`${basePath}/${session1._id}/scan-candidate`, {
    method: "POST",
    headers: authed(candidateToken),
    body: JSON.stringify({ candidateQrToken: badgeBody.attendanceQrToken }),
  });
  check("candidate cannot mark their own attendance -> 403", selfScanAttemptRes.status === 403);

  // Trainer scans the candidate's badge.
  const scanRes = await fetch(`${basePath}/${session1._id}/scan-candidate`, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ candidateQrToken: badgeBody.attendanceQrToken }),
  });
  const scanBody = (await scanRes.json()) as { status: string };
  check("trainer scans candidate badge -> 201, status present", scanRes.status === 201 && scanBody.status === "present");

  const rescanRes = await fetch(`${basePath}/${session1._id}/scan-candidate`, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ candidateQrToken: badgeBody.attendanceQrToken }),
  });
  check("scanning the same candidate into the same session twice -> 409", rescanRes.status === 409);

  const garbageScanRes = await fetch(`${basePath}/${session1._id}/scan-candidate`, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ candidateQrToken: "not-a-real-badge" }),
  });
  check("scanning a bogus candidate badge -> 404", garbageScanRes.status === 404);

  const enrollmentAfterDay1 = await Enrollment.findById(approveBody.enrollmentId);
  check("attendancePercent recomputed to 100 after 1/1 sessions", (enrollmentAfterDay1 as unknown as { attendancePercent: number })?.attendancePercent === 100);

  // Candidate regenerates their badge (e.g. after losing their phone) — the old one must stop working.
  const regenRes = await fetch(`${base}/api/v1/me/attendance-qr/regenerate`, { method: "POST", headers: authed(candidateToken) });
  const regenBody = (await regenRes.json()) as { attendanceQrToken: string };
  check("candidate regenerates badge -> 200, token changes", regenRes.status === 200 && regenBody.attendanceQrToken !== badgeBody.attendanceQrToken);
  const oldBadgeScanRes = await fetch(`${basePath}/${session1._id}/scan-candidate`, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ candidateQrToken: badgeBody.attendanceQrToken }),
  });
  check("the old badge token no longer resolves after regeneration -> 404", oldBadgeScanRes.status === 404);

  // Day 2: manager (also permitted) opens then immediately closes — scans against a closed session must be rejected.
  const genSession2Res = await fetch(basePath, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ sessionDate: new Date().toISOString(), sessionLabel: "Day 2", expiresInMinutes: 60 }),
  });
  const session2 = (await genSession2Res.json()) as { _id: string };
  check("manager can also open a session -> 201", genSession2Res.status === 201);
  const closeSession2Res = await fetch(`${basePath}/${session2._id}/close`, { method: "PATCH", headers: authed(managerToken) });
  check("manager closes Day 2 session -> 200, status closed", closeSession2Res.status === 200 && (await closeSession2Res.json()).status === "closed");

  const scanClosedRes = await fetch(`${basePath}/${session2._id}/scan-candidate`, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ candidateQrToken: regenBody.attendanceQrToken }),
  });
  check("scanning into a closed session -> 400", scanClosedRes.status === 400);

  // Day 3: candidate forgot their phone entirely — trainer marks them manually as late (no badge scan).
  const genSession3Res = await fetch(basePath, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ sessionDate: new Date().toISOString(), sessionLabel: "Day 3", expiresInMinutes: 60 }),
  });
  const session3 = (await genSession3Res.json()) as { _id: string };
  const manualMarkRes = await fetch(`${basePath}/${session3._id}/records`, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ candidateUserId: approveBody.candidateUserId, status: "late" }),
  });
  const manualMarkBody = (await manualMarkRes.json()) as { status: string };
  check("trainer manually marks candidate late for Day 3 -> 201", manualMarkRes.status === 201 && manualMarkBody.status === "late");

  const enrollmentAfterDay3 = await Enrollment.findById(approveBody.enrollmentId);
  // 3 sessions total (Day1 scanned present, Day2 closed no scan, Day3 manually marked late) — 2 counted present/late = 67%.
  check(
    "attendancePercent recomputed to 67 after 2/3 sessions counted",
    (enrollmentAfterDay3 as unknown as { attendancePercent: number })?.attendancePercent === 67,
  );

  const candidateOwnRecordsRes = await fetch(`${base}/api/v1/attendance/records`, { headers: authed(candidateToken) });
  const candidateOwnRecords = (await candidateOwnRecordsRes.json()) as unknown[];
  check("candidate sees their own 2 attendance records", candidateOwnRecordsRes.status === 200 && candidateOwnRecords.length === 2);

  const managerBatchRecordsRes = await fetch(`${base}/api/v1/attendance/records?batchId=${batch._id}`, { headers: authed(managerToken) });
  const managerBatchRecords = (await managerBatchRecordsRes.json()) as unknown[];
  check("manager sees 2 project-wide attendance records for the batch", managerBatchRecordsRes.status === 200 && managerBatchRecords.length === 2);

  // --- Assessment ---
  const assessmentsPath = `${base}/api/v1/workshops/${workshop._id}/assessments`;

  const createAssessmentRes = await fetch(assessmentsPath, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({
      title: "Digital Literacy Quiz",
      passingPercent: 50,
      durationMinutes: 30,
      maxAttempts: 1,
      questions: [
        {
          questionText: "2 + 2 = ?",
          type: "single_choice",
          marks: 5,
          options: [
            { text: "3", isCorrect: false },
            { text: "4", isCorrect: true },
          ],
        },
        {
          questionText: "Capital of France?",
          type: "single_choice",
          marks: 5,
          options: [
            { text: "Paris", isCorrect: true },
            { text: "London", isCorrect: false },
          ],
        },
      ],
    }),
  });
  const assessment = (await createAssessmentRes.json()) as { _id: string; totalMarks: number };
  check("manager creates assessment -> 201, totalMarks 10", createAssessmentRes.status === 201 && assessment.totalMarks === 10);

  const candidateListBeforeEnableRes = await fetch(`${assessmentsPath}`, { headers: authed(candidateToken) });
  const candidateListBeforeEnable = (await candidateListBeforeEnableRes.json()) as unknown[];
  check("candidate sees no assessments while disabled", candidateListBeforeEnableRes.status === 200 && candidateListBeforeEnable.length === 0);

  // Enabling/disabling an assessment is a Trainer capability per the spec ("Trainer: Enable/Disable Assessment").
  const enableAssessmentRes = await fetch(`${assessmentsPath}/${assessment._id}/enabled`, {
    method: "PATCH",
    headers: authed(trainerToken),
    body: JSON.stringify({ isEnabled: true }),
  });
  check("trainer enables the assessment -> 200", enableAssessmentRes.status === 200);

  const candidateListAfterEnableRes = await fetch(assessmentsPath, { headers: authed(candidateToken) });
  const candidateListAfterEnable = (await candidateListAfterEnableRes.json()) as { questions: { options: Record<string, unknown>[] }[] }[];
  check(
    "candidate now sees the assessment, options never leak isCorrect",
    candidateListAfterEnableRes.status === 200 &&
      candidateListAfterEnable.length === 1 &&
      !("isCorrect" in candidateListAfterEnable[0]!.questions[0]!.options[0]!),
  );

  const startAttemptRes = await fetch(`${assessmentsPath}/${assessment._id}/attempts`, { method: "POST", headers: authed(candidateToken) });
  const startAttemptBody = (await startAttemptRes.json()) as { attempt: { _id: string } };
  check("candidate starts an attempt -> 201", startAttemptRes.status === 201);

  const trainerAttemptsRes = await fetch(`${assessmentsPath}/${assessment._id}/attempts`, { headers: authed(trainerToken) });
  const trainerAttempts = (await trainerAttemptsRes.json()) as { status: string }[];
  check(
    "trainer sees the in-progress attempt",
    trainerAttemptsRes.status === 200 && trainerAttempts.length === 1 && trainerAttempts[0]?.status === "in_progress",
  );

  const submitAttemptRes = await fetch(`${assessmentsPath}/${assessment._id}/attempts/${startAttemptBody.attempt._id}/submit`, {
    method: "POST",
    headers: authed(candidateToken),
    body: JSON.stringify({
      answers: [
        { questionIndex: 0, selectedOptions: [1] },
        { questionIndex: 1, selectedOptions: [0] },
      ],
    }),
  });
  const submitAttemptBody = (await submitAttemptRes.json()) as { attempt: { score: number; percentage: number; result: string }; assessmentStatus: string };
  check(
    "candidate submits both answers correctly -> 100%, pass",
    submitAttemptRes.status === 200 && submitAttemptBody.attempt.score === 10 && submitAttemptBody.attempt.result === "pass",
  );
  check("enrollment.assessmentStatus recomputed to passed", submitAttemptBody.assessmentStatus === "passed");

  const secondAttemptRes = await fetch(`${assessmentsPath}/${assessment._id}/attempts`, { method: "POST", headers: authed(candidateToken) });
  check("starting a 2nd attempt beyond maxAttempts -> 409", secondAttemptRes.status === 409);

  const editQuestionsAfterAttemptRes = await fetch(`${assessmentsPath}/${assessment._id}`, {
    method: "PATCH",
    headers: authed(managerToken),
    body: JSON.stringify({ passingPercent: 90 }),
  });
  check("editing locked fields after an attempt exists -> 409", editQuestionsAfterAttemptRes.status === 409);

  const editTitleAfterAttemptRes = await fetch(`${assessmentsPath}/${assessment._id}`, {
    method: "PATCH",
    headers: authed(managerToken),
    body: JSON.stringify({ title: "Digital Literacy Quiz (v1)" }),
  });
  check("editing an unlocked field (title) after an attempt exists -> 200", editTitleAfterAttemptRes.status === 200);

  // --- Feedback ---
  const feedbackFormsPath = `${base}/api/v1/workshops/${workshop._id}/feedback-forms`;

  const createFormRes = await fetch(feedbackFormsPath, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ questions: [{ questionText: "How was the training overall?", type: "rating", required: true }] }),
  });
  const feedbackForm = (await createFormRes.json()) as { _id: string };
  check("manager creates feedback form -> 201", createFormRes.status === 201);

  const enableFormRes = await fetch(`${feedbackFormsPath}/${feedbackForm._id}/enabled`, {
    method: "PATCH",
    headers: authed(trainerToken),
    body: JSON.stringify({ isEnabled: true }),
  });
  check("trainer enables feedback -> 200", enableFormRes.status === 200);

  // --- Certificate gate check BEFORE feedback is submitted ---
  const eligibilityBeforeFeedbackRes = await fetch(`${base}/api/v1/enrollments/${approveBody.enrollmentId}/certificate/eligibility`, {
    headers: authed(managerToken),
  });
  const eligibilityBeforeFeedback = (await eligibilityBeforeFeedbackRes.json()) as {
    eligible: boolean;
    gates: { attendance: { met: boolean }; assessment: { met: boolean }; feedback: { met: boolean } };
  };
  check(
    "eligibility before feedback: attendance+assessment met, feedback blocks it",
    eligibilityBeforeFeedbackRes.status === 200 &&
      eligibilityBeforeFeedback.gates.attendance.met === true &&
      eligibilityBeforeFeedback.gates.assessment.met === true &&
      eligibilityBeforeFeedback.gates.feedback.met === false &&
      eligibilityBeforeFeedback.eligible === false,
  );

  const submitFeedbackRes = await fetch(`${feedbackFormsPath}/${feedbackForm._id}/responses`, {
    method: "POST",
    headers: authed(candidateToken),
    body: JSON.stringify({ courseRating: 5, trainerRating: 5, comments: "Great session!", answers: [{ questionIndex: 0, ratingValue: 5 }] }),
  });
  check("candidate submits feedback -> 201", submitFeedbackRes.status === 201);

  const duplicateFeedbackRes = await fetch(`${feedbackFormsPath}/${feedbackForm._id}/responses`, {
    method: "POST",
    headers: authed(candidateToken),
    body: JSON.stringify({ courseRating: 4 }),
  });
  check("submitting feedback twice -> 409", duplicateFeedbackRes.status === 409);

  // --- Certificate issuance (all 3 gates now met) ---
  const eligibilityAfterFeedbackRes = await fetch(`${base}/api/v1/enrollments/${approveBody.enrollmentId}/certificate/eligibility`, {
    headers: authed(managerToken),
  });
  const eligibilityAfterFeedback = (await eligibilityAfterFeedbackRes.json()) as { eligible: boolean };
  check("eligibility after feedback: fully eligible", eligibilityAfterFeedback.eligible === true);

  const createTemplateRes = await fetch(`${base}/api/v1/certificate-templates`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ name: "Standard Certificate" }),
  });
  const template = (await createTemplateRes.json()) as { _id: string };
  check("manager creates a certificate template -> 201", createTemplateRes.status === 201);

  const trainerIssueAttemptRes = await fetch(`${base}/api/v1/enrollments/${approveBody.enrollmentId}/certificate`, {
    method: "POST",
    headers: authed(trainerToken),
    body: JSON.stringify({ templateId: template._id }),
  });
  check("trainer cannot issue certificates (no CERTIFICATE_ISSUE) -> 403", trainerIssueAttemptRes.status === 403);

  const issueRes = await fetch(`${base}/api/v1/enrollments/${approveBody.enrollmentId}/certificate`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ templateId: template._id }),
  });
  const certificate = (await issueRes.json()) as { certificateNumber: string; verificationCode: string; status: string };
  check("manager issues the certificate -> 201, status issued", issueRes.status === 201 && certificate.status === "issued");

  const doubleIssueRes = await fetch(`${base}/api/v1/enrollments/${approveBody.enrollmentId}/certificate`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ templateId: template._id }),
  });
  check("issuing a 2nd active certificate for the same enrollment -> 409", doubleIssueRes.status === 409);

  const verifyRes = await fetch(`${base}/api/v1/certificates/verify/${certificate.verificationCode}`);
  const verifyBody = (await verifyRes.json()) as { candidateName: string; workshopTitle: string; status: string };
  check("public verify (no auth) resolves a candidate name", verifyRes.status === 200 && Boolean(verifyBody.candidateName));
  check("verify shows the right workshop title", verifyBody.workshopTitle === "Digital Literacy Bootcamp");
  check("verify shows status issued", verifyBody.status === "issued");

  const candidateCertsRes = await fetch(`${base}/api/v1/certificates`, { headers: authed(candidateToken) });
  const candidateCerts = (await candidateCertsRes.json()) as unknown[];
  check("candidate sees their own 1 certificate", candidateCertsRes.status === 200 && candidateCerts.length === 1);

  // --- Revoke + reissue (the partial-unique-index fix from the design review) ---
  const certRecord = await (await import("../src/models/Certificate")).Certificate.findOne({ verificationCode: certificate.verificationCode });
  const revokeRes = await fetch(`${base}/api/v1/certificates/${certRecord!.id}/revoke`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ reason: "Name spelling correction needed" }),
  });
  check("manager revokes the certificate -> 200, status revoked", revokeRes.status === 200 && (await revokeRes.json()).status === "revoked");

  const verifyAfterRevokeRes = await fetch(`${base}/api/v1/certificates/verify/${certificate.verificationCode}`);
  check("verify now shows revoked", (await verifyAfterRevokeRes.json()).status === "revoked");

  const reissueRes = await fetch(`${base}/api/v1/enrollments/${approveBody.enrollmentId}/certificate`, {
    method: "POST",
    headers: authed(managerToken),
    body: JSON.stringify({ templateId: template._id }),
  });
  const reissuedCertificate = (await reissueRes.json()) as { certificateNumber: string; status: string };
  check(
    "reissuing after revoke -> 201, new certificate number, status issued",
    reissueRes.status === 201 && reissuedCertificate.status === "issued" && reissuedCertificate.certificateNumber !== certificate.certificateNumber,
  );

  const enrollmentAfterReissue = await Enrollment.findById(approveBody.enrollmentId);
  check("enrollment.status back to certified after reissue", (enrollmentAfterReissue as unknown as { status: string })?.status === "certified");

  server.close();
  await disconnectDB();
  await replSet.stop();

  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.error(`[flow] ${failed.length}/${results.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log(`[flow] ALL ${results.length} CHECKS PASSED`);
}

main().catch((err) => {
  console.error("[flow] FAILED", err);
  process.exit(1);
});
