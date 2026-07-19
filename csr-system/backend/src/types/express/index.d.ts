import type { RoleCode } from "../enums";
import type { PermissionCode } from "../permissions";

export interface AuthenticatedUser {
  userId: string;
  projectId: string;
  roleCode: RoleCode;
  permissions: PermissionCode[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
