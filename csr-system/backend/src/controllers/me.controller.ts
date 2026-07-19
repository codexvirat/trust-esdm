import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as meService from "../services/me.service";
import * as trainerAssignmentService from "../services/trainerAssignment.service";
import * as workshopManagerAssignmentService from "../services/workshopManagerAssignment.service";
import { ApiError } from "../utils/ApiError";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await meService.getOwnProfile(req.user.userId);
  res.json(result);
});

export const updateCandidateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "candidate") throw ApiError.forbidden("Only candidates have this profile type");
  const profile = await meService.updateCandidateProfile(req.user.userId, req.body);
  res.json(profile);
});

export const updateTrainerProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "trainer") throw ApiError.forbidden("Only trainers have this profile type");
  const profile = await meService.updateTrainerProfile(req.user.userId, req.body);
  res.json(profile);
});

export const getAttendanceQr = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "candidate") throw ApiError.forbidden("Only candidates have an attendance badge");
  const token = await meService.getOwnAttendanceQr(req.user.userId);
  res.json({ attendanceQrToken: token });
});

export const regenerateAttendanceQr = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "candidate") throw ApiError.forbidden("Only candidates have an attendance badge");
  const token = await meService.regenerateOwnAttendanceQr(req.user.userId);
  res.json({ attendanceQrToken: token });
});

export const getOwnTrainerAssignments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "trainer") throw ApiError.forbidden("Only trainers have batch assignments");
  res.json(await trainerAssignmentService.listOwnAssignments(req.user.projectId, req.user.userId));
});

export const getOwnWorkshopManagerAssignments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "workshop_manager") throw ApiError.forbidden("Only workshop managers have batch assignments");
  res.json(await workshopManagerAssignmentService.listOwnAssignments(req.user.projectId, req.user.userId));
});
