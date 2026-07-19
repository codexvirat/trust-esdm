import { Router } from "express";
import * as controller from "../controllers/venue.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createVenueSchema, updateVenueSchema } from "../validators/venue.validators";
import { PERMISSIONS } from "../types/permissions";

export const venueRouter = Router();

venueRouter.use(requireAuth);

venueRouter.get("/", controller.list);
venueRouter.post("/", requirePermission(PERMISSIONS.WORKSHOP_CREATE), validate(createVenueSchema), controller.create);
venueRouter.patch("/:id", requirePermission(PERMISSIONS.WORKSHOP_EDIT), validate(updateVenueSchema), controller.update);
venueRouter.delete("/:id", requirePermission(PERMISSIONS.WORKSHOP_DELETE), controller.remove);
