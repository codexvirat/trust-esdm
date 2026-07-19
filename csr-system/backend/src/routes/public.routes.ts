import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as controller from "../controllers/public.controller";
import { validate } from "../middleware/validate";
import { applyForWorkshopSchema } from "../validators/registration.validators";
import { listPublicWorkshopsQuerySchema } from "../validators/workshop.validators";

export const publicRouter = Router();

const applyLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

publicRouter.get("/:projectSlug/workshops", validate(listPublicWorkshopsQuerySchema), controller.listWorkshops);
publicRouter.get("/:projectSlug/workshops/:workshopSlug", controller.getWorkshopBySlug);
publicRouter.get("/:projectSlug/workshops/:workshopSlug/batches", controller.getWorkshopBatches);
publicRouter.get("/:projectSlug/batches/:batchId", controller.getBatchById);
publicRouter.get("/:projectSlug/marquee", controller.getMarquee);
publicRouter.get("/:projectSlug/organisations", controller.listOrganisations);
publicRouter.post("/:projectSlug/registrations", applyLimiter, validate(applyForWorkshopSchema), controller.apply);
