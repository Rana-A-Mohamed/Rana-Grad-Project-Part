import { z } from 'zod';
import { RoleName } from '@prisma/client';

export const assignRoleParamsSchema = z.object({
  userId: z.string().min(1),
});

export const assignRoleBodySchema = z.object({
  roleName: z.nativeEnum(RoleName),
});

export type AssignRoleInput = z.infer<typeof assignRoleBodySchema>;