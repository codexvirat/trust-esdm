import { Router } from "express";
import * as controller from "../controllers/certificateTemplate.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { uploadCertificateTemplateBackground } from "../middleware/upload";
import { createCertificateTemplateSchema } from "../validators/certificate.validators";
import { PERMISSIONS } from "../types/permissions";

export const certificateTemplateRouter = Router();

certificateTemplateRouter.use(requireAuth);

certificateTemplateRouter.get("/", requirePermission(PERMISSIONS.CERTIFICATE_VIEW), controller.list);
certificateTemplateRouter.get("/:id", requirePermission(PERMISSIONS.CERTIFICATE_VIEW), controller.getById);
certificateTemplateRouter.post("/", requirePermission(PERMISSIONS.CERTIFICATE_ISSUE), validate(createCertificateTemplateSchema), controller.create);
certificateTemplateRouter.post(
  "/upload",
  requirePermission(PERMISSIONS.CERTIFICATE_ISSUE),
  uploadCertificateTemplateBackground.single("background"),
  controller.uploadBackground,
);
certificateTemplateRouter.delete("/:id", requirePermission(PERMISSIONS.CERTIFICATE_ISSUE), controller.remove);
