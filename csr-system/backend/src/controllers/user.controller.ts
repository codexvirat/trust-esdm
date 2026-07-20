import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as userService from "../services/user.service";
import { ApiError } from "../utils/ApiError";
import { PERMISSIONS } from "../types/permissions";
import type { RoleCode } from "../types/enums";

const REQUIRED_PERMISSION_FOR_ROLE: Record<RoleCode, (typeof PERMISSIONS)[keyof typeof PERMISSIONS]> = {
  super_admin: PERMISSIONS.USER_MANAGE_ADMIN,
  admin: PERMISSIONS.USER_MANAGE_ADMIN,
  manager: PERMISSIONS.USER_MANAGE_MANAGER,
  workshop_manager: PERMISSIONS.USER_MANAGE_WORKSHOP_MANAGER,
  trainer: PERMISSIONS.USER_MANAGE_TRAINER,
  candidate: PERMISSIONS.USER_MANAGE_CANDIDATE,
};

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const targetRole: RoleCode = req.body.roleCode;
  const required = REQUIRED_PERMISSION_FOR_ROLE[targetRole];
  if (!req.user.permissions.includes(required)) {
    throw ApiError.forbidden(`Missing permission ${required} to create a ${targetRole} account`);
  }

  // Only a Super Admin may target an project other than their own —
  // e.g. platform-managed onboarding of a new tenant's first Manager.
  const projectId = req.user.roleCode === "super_admin" && req.body.projectId ? req.body.projectId : req.user.projectId;

  const user = await userService.createUserDirect({
    ...req.body,
    projectId,
    createdBy: req.user.userId,
    // Candidates get a silent account now and a real welcome email (with
    // credentials + QR badge) later when a manager enrolls them into a batch.
    sendWelcomeEmail: targetRole !== "candidate",
  });
  res.status(201).json(user);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  // Only a Super Admin may cross into another project's user list —
  // same override rule as targeting projectId on create, above.
  const projectId = req.user.roleCode === "super_admin" && req.query.projectId ? (req.query.projectId as string) : req.user.projectId;
  const users = await userService.listUsers(projectId, {
    roleCode: req.query.roleCode as RoleCode | undefined,
    status: req.query.status as string | undefined,
  });
  res.json(users);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const projectId = req.user.roleCode === "super_admin" && req.query.projectId ? (req.query.projectId as string) : req.user.projectId;
  const user = await userService.getUserById(projectId, req.params.id as string);
  res.json(user);
});

export const getCandidateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.user.permissions.includes(PERMISSIONS.USER_MANAGE_CANDIDATE)) {
    throw ApiError.forbidden(`Missing permission ${PERMISSIONS.USER_MANAGE_CANDIDATE} to view candidate profiles`);
  }
  const projectId = req.user.roleCode === "super_admin" && req.query.projectId ? (req.query.projectId as string) : req.user.projectId;
  const result = await userService.getUserCandidateProfile(projectId, req.params.id as string);
  res.json(result);
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const projectId = req.user.roleCode === "super_admin" && req.query.projectId ? (req.query.projectId as string) : req.user.projectId;
  const user = await userService.setUserStatus(projectId, req.params.id as string, req.body.status, req.user.userId);
  res.json(user);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  // Editing name/email/phone can reassign who can log in as this account, so
  // it's restricted beyond the usual per-role USER_MANAGE_* permissions —
  // only a Super Admin may do it, regardless of target role.
  if (req.user.roleCode !== "super_admin") {
    throw ApiError.forbidden("Only a Super Admin may edit account details");
  }
  const projectId = req.query.projectId ? (req.query.projectId as string) : req.user.projectId;
  const user = await userService.updateUserBasicInfo(projectId, req.params.id as string, req.body, req.user.userId);
  res.json(user);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const projectId = req.user.roleCode === "super_admin" && req.query.projectId ? (req.query.projectId as string) : req.user.projectId;
  await userService.softDeleteUser(projectId, req.params.id as string, req.user.userId);
  res.status(204).send();
});
