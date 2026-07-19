import { Router } from "express";
import * as controller from "../controllers/certificate.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { revokeCertificateSchema } from "../validators/certificate.validators";
import { PERMISSIONS } from "../types/permissions";

export const certificateRouter = Router();

// Public verification (QR scan target) — registered BEFORE requireAuth below,
// so this one route never hits the auth middleware for this router.
certificateRouter.get("/verify/:code", controller.verify);

certificateRouter.use(requireAuth);

// Visibility (own vs project-wide) resolved inside the controller by req.user.roleCode.
certificateRouter.get("/", controller.list);
certificateRouter.post("/:id/revoke", requirePermission(PERMISSIONS.CERTIFICATE_REVOKE), validate(revokeCertificateSchema), controller.revoke);
