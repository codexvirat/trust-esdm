import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as authService from "../services/auth.service";
import { ApiError } from "../utils/ApiError";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });
  res.json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh({ refreshToken: req.body.refreshToken });
  res.json(result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout({ refreshToken: req.body.refreshToken });
  res.status(204).send();
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await authService.logoutAllDevices(req.user.userId);
  res.status(204).send();
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
  res.status(204).send();
});
