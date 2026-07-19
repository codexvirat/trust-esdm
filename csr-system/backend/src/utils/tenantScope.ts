import type { Request } from "express";
import { Types } from "mongoose";
import { ApiError } from "./ApiError";

/**
 * The project a request should be scoped to. Normally the caller's own
 * project — except a super_admin may cross into another tenant by passing
 * `projectId` (query for reads, body for writes), the same override
 * `user.controller.ts` already uses for platform-level onboarding.
 */
export function resolveProjectId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  const override = (req.query.projectId as string | undefined) ?? (req.body?.projectId as string | undefined);
  return req.user.roleCode === "super_admin" && override ? override : req.user.projectId;
}

/**
 * Every tenant-scoped query builds its filter through this helper rather than
 * trusting an individual controller to remember `projectId` — see design
 * doc Part 17 ("Tenant isolation enforced at the query-builder layer").
 */
export function tenantFilter(req: Request): { projectId: Types.ObjectId } {
  return { projectId: new Types.ObjectId(resolveProjectId(req)) };
}
