import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createUserSchema, setStatusSchema, updateUserSchema } from "../validators/user.validators";

export const userRouter = Router();

userRouter.use(requireAuth);

// Fine-grained per-target-role permission checks happen inside the controller
// (USER_MANAGE_MANAGER vs USER_MANAGE_TRAINER vs USER_MANAGE_CANDIDATE) since
// the required permission depends on req.body.roleCode, not the route itself.
userRouter.post("/", validate(createUserSchema), controller.create);
userRouter.get("/", controller.list);
userRouter.get("/:id", controller.getById);
userRouter.get("/:id/candidate-profile", controller.getCandidateProfile);
userRouter.patch("/:id/status", validate(setStatusSchema), controller.setStatus);
// Editing basic account details (name/email/phone) is Super Admin-only —
// see controller.update — since it can silently reassign a login identity.
userRouter.patch("/:id", validate(updateUserSchema), controller.update);
userRouter.post("/:id/resend-credentials", controller.resendCredentials);
userRouter.delete("/:id", controller.remove);
