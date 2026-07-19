import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as projectService from "../services/project.service";
import { ApiError } from "../utils/ApiError";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const project = await projectService.createProject({ ...req.body, createdBy: req.user.userId });
  res.status(201).json(project);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectService.listProjects({
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    type: typeof req.query.type === "string" ? req.query.type : undefined,
  });
  res.json(projects);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(req.params.id as string);
  res.json(project);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const project = await projectService.updateProject(req.params.id as string, req.body, req.user.userId);
  res.json(project);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  // Deleting your own home project orphans every admin page that falls
  // back to req.user.projectId when no project is explicitly selected —
  // the account survives but silently sees empty/wrong data everywhere.
  if (req.params.id === req.user.projectId) {
    throw ApiError.badRequest("You can't remove the project your own account belongs to");
  }
  await projectService.deleteProject(req.params.id as string, req.user.userId);
  res.status(204).send();
});
