import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/certificateTemplate.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";
import { certificateLayoutConfigSchema } from "../validators/certificate.validators";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const template = await service.createTemplate({ ...req.body, projectId: resolveProjectId(req), createdBy: req.user.userId });
  res.status(201).json(template);
});

export const uploadBackground = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.file) throw ApiError.badRequest("A background image file is required");

  const name = String(req.body.name ?? "").trim();
  if (name.length < 2) throw ApiError.badRequest("A template name is required");

  let layoutConfig: Record<string, unknown> | undefined;
  if (req.body.layoutConfig) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(req.body.layoutConfig);
    } catch {
      throw ApiError.badRequest("layoutConfig must be valid JSON");
    }
    const result = certificateLayoutConfigSchema.safeParse(parsed);
    if (!result.success) throw ApiError.badRequest("Invalid layoutConfig", result.error.flatten());
    layoutConfig = result.data;
  }

  const backgroundImageUrl = `${req.protocol}://${req.get("host")}/uploads/certificate-templates/${req.file.filename}`;
  const template = await service.createTemplate({
    projectId: resolveProjectId(req),
    name,
    backgroundImageUrl,
    layoutConfig,
    createdBy: req.user.userId,
  });
  res.status(201).json(template);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listTemplates(resolveProjectId(req)));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.getTemplateById(resolveProjectId(req), req.params.id as string));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteTemplate(resolveProjectId(req), req.params.id as string, req.user.userId);
  res.status(204).send();
});
