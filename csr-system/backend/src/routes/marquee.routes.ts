import { Router } from "express";
import * as controller from "../controllers/marquee.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createMarqueeSchema, updateMarqueeSchema } from "../validators/marquee.validators";
import { PERMISSIONS } from "../types/permissions";

export const marqueeRouter = Router();

marqueeRouter.use(requireAuth);

marqueeRouter.get("/", controller.list);
marqueeRouter.post("/", requirePermission(PERMISSIONS.WORKSHOP_CREATE), validate(createMarqueeSchema), controller.create);
marqueeRouter.patch("/:id", requirePermission(PERMISSIONS.WORKSHOP_EDIT), validate(updateMarqueeSchema), controller.update);
marqueeRouter.delete("/:id", requirePermission(PERMISSIONS.WORKSHOP_DELETE), controller.remove);
