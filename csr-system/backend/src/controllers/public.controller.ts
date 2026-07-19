import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as workshopService from "../services/workshop.service";
import * as registrationService from "../services/registration.service";
import * as batchService from "../services/batch.service";
import * as marqueeService from "../services/marquee.service";
import * as organisationService from "../services/organisation.service";
import { Project } from "../models/Project";
import { ApiError } from "../utils/ApiError";

async function resolveProjectOrThrow(projectSlug: string) {
  const project = await Project.findOne({ slug: projectSlug.toLowerCase(), status: "active" });
  if (!project) throw ApiError.notFound("Project not found");
  return project;
}

export const listWorkshops = asyncHandler(async (req: Request, res: Response) => {
  const project = await resolveProjectOrThrow(req.params.projectSlug as string);
  const result = await workshopService.searchPublicWorkshops(project.id, {
    q: req.query.q as string | undefined,
    category: req.query.category as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json(result);
});

export const getWorkshopBySlug = asyncHandler(async (req: Request, res: Response) => {
  const project = await resolveProjectOrThrow(req.params.projectSlug as string);
  const workshop = await workshopService.getPublicWorkshopBySlug(project.id, req.params.workshopSlug as string);
  res.json(workshop);
});

export const getWorkshopBatches = asyncHandler(async (req: Request, res: Response) => {
  const project = await resolveProjectOrThrow(req.params.projectSlug as string);
  const workshop = await workshopService.getPublicWorkshopBySlug(project.id, req.params.workshopSlug as string);
  res.json(await batchService.getPublicBatchesForWorkshop(project.id, workshop.id));
});

export const getBatchById = asyncHandler(async (req: Request, res: Response) => {
  const project = await resolveProjectOrThrow(req.params.projectSlug as string);
  res.json(await batchService.getPublicBatchById(project.id, req.params.batchId as string));
});

export const getMarquee = asyncHandler(async (req: Request, res: Response) => {
  const project = await resolveProjectOrThrow(req.params.projectSlug as string);
  res.json(await marqueeService.listActiveMarqueesForProject(project.id));
});

export const listOrganisations = asyncHandler(async (req: Request, res: Response) => {
  const project = await resolveProjectOrThrow(req.params.projectSlug as string);
  res.json(await organisationService.listPublicOrganisations(project.id));
});

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const project = await resolveProjectOrThrow(req.params.projectSlug as string);
  const registration = await registrationService.applyForWorkshop({ ...req.body, projectId: project.id });
  res.status(201).json({
    message: "Application submitted. You'll be notified by email once it's reviewed.",
    registrationId: registration.id,
    status: registration.status,
  });
});
