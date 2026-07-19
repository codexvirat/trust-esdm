import { Router } from "express";
import * as controller from "../controllers/registration.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { approveRegistrationSchema, rejectRegistrationSchema, registerAndApproveSchema } from "../validators/registration.validators";
import { PERMISSIONS } from "../types/permissions";

export const registrationRouter = Router();

registrationRouter.use(requireAuth, requirePermission(PERMISSIONS.REGISTRATION_VIEW));

registrationRouter.get("/", controller.list);
// Staff-initiated walk-in registration — skips the pending queue since
// whoever can hit this already has REGISTRATION_APPROVE authority.
registrationRouter.post(
  "/",
  requirePermission(PERMISSIONS.REGISTRATION_APPROVE),
  validate(registerAndApproveSchema),
  controller.registerAndApprove,
);
registrationRouter.get("/:id", controller.getById);
registrationRouter.post(
  "/:id/approve",
  requirePermission(PERMISSIONS.REGISTRATION_APPROVE),
  validate(approveRegistrationSchema),
  controller.approve,
);
registrationRouter.post(
  "/:id/reject",
  requirePermission(PERMISSIONS.REGISTRATION_REJECT),
  validate(rejectRegistrationSchema),
  controller.reject,
);
