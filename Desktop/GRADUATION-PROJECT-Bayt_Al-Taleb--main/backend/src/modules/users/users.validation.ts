import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(100).trim(),
  roleId: z.string().min(1),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).trim().optional(),
  isActive: z.boolean().optional(),
  roleId: z.string().min(1).optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const listUsersQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role:   z.string().optional(),
});

export type CreateUserInput  = z.infer<typeof createUserSchema>;
export type UpdateUserInput  = z.infer<typeof updateUserSchema>;
export type ListUsersQuery   = z.infer<typeof listUsersQuerySchema>;