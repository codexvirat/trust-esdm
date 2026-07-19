import { z } from "zod";
import { PERMISSION_CATALOG } from "../types/permissions";

const permissionCodeEnum = z.enum(PERMISSION_CATALOG.map((p) => p.code) as [string, ...string[]]);

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z
      .string()
      .min(2)
      .regex(/^[A-Za-z0-9_]+$/, "code must be letters, numbers, underscores only"),
    description: z.string().optional(),
    permissions: z.array(permissionCodeEnum).min(1),
  }),
});
