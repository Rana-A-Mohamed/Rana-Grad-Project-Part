import { z } from 'zod';

export const createMajorSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(2).max(200),
  degree: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  collegeId: z.string().cuid().nullable().optional(),
});

export const updateMajorSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  name: z.string().min(2).max(200).optional(),
  degree: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  collegeId: z.string().cuid().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const majorIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const majorSlugParamsSchema = z.object({
  slug: z.string().min(2).max(120),
});

export const listMajorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  collegeId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const deleteMajorSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateMajorInput = z.infer<typeof createMajorSchema>;
export type UpdateMajorInput = z.infer<typeof updateMajorSchema>;
export type ListMajorsQuery = z.infer<typeof listMajorsQuerySchema>;
