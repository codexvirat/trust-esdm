import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { loginSchema, refreshSchema, changePasswordSchema } from "../validators/auth.validators";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, validate(loginSchema), authController.login);
authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
authRouter.post("/logout", validate(refreshSchema), authController.logout);
authRouter.post("/logout-all", requireAuth, authController.logoutAll);
authRouter.post("/change-password", requireAuth, validate(changePasswordSchema), authController.changePassword);
