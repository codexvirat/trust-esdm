import { Role } from "../models/Role";
import { PERMISSION_CATALOG } from "../types/permissions";
import type { PermissionCode } from "../types/permissions";
import { ApiError } from "../utils/ApiError";

const VALID_CODES = new Set(PERMISSION_CATALOG.map((p) => p.code));

export async function listRolesForProject(projectId: string) {
  return Role.find({ $or: [{ projectId: null }, { projectId }] }).sort({ isSystemRole: -1, name: 1 });
}

export async function createCustomRole(input: {
  projectId: string;
  name: string;
  code: string;
  description?: string;
  permissions: PermissionCode[];
  createdBy: string;
}) {
  const invalid = input.permissions.filter((code) => !VALID_CODES.has(code));
  if (invalid.length > 0) {
    throw ApiError.badRequest(`Unknown permission code(s): ${invalid.join(", ")}`);
  }

  const existing = await Role.findOne({ projectId: input.projectId, code: input.code.toUpperCase() });
  if (existing) throw ApiError.conflict(`Role code "${input.code}" already exists in this project`);

  return Role.create({
    projectId: input.projectId,
    name: input.name,
    code: input.code.toUpperCase(),
    description: input.description,
    isSystemRole: false,
    permissions: input.permissions,
    createdBy: input.createdBy,
  });
}
