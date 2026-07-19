import { Router } from "express";
import * as controller from "../controllers/enrollment.controller";
import * as certificateController from "../controllers/certificate.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { issueCertificateSchema } from "../validators/certificate.validators";
import { enrollCandidateSchema } from "../validators/enrollment.validators";
import { PERMISSIONS } from "../types/permissions";

export const enrollmentRouter = Router();

enrollmentRouter.use(requireAuth);

// Fine-grained visibility (own vs project-wide) is resolved inside the controller
// since it depends on req.user.roleCode, not the route itself.
enrollmentRouter.get("/", controller.list);

// Step 2 of the two-step candidate flow: enroll an already-registered
// candidate into a batch. Reuses REGISTRATION_APPROVE — same staff authority
// as approving a public registration into an enrollment.
enrollmentRouter.post("/", requirePermission(PERMISSIONS.REGISTRATION_APPROVE), validate(enrollCandidateSchema), controller.create);

enrollmentRouter.get("/:id", controller.getById);

// The 3-gate certificate check (attendance % + assessment pass + feedback
// submitted) always evaluates one specific enrollment — see certificate.service.ts.
enrollmentRouter.get("/:id/certificate/eligibility", requirePermission(PERMISSIONS.CERTIFICATE_VIEW), certificateController.checkEligibility);
enrollmentRouter.post(
  "/:id/certificate",
  requirePermission(PERMISSIONS.CERTIFICATE_ISSUE),
  validate(issueCertificateSchema),
  certificateController.issue,
);
