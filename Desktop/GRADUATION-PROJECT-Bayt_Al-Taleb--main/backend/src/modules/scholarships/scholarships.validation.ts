import { z } from 'zod';

export const createScholarshipSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(200).trim(),
});

export const updateScholarshipSchema = z.object({
  slug:     z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  name:     z.string().min(2).max(200).trim().optional(),
  isActive: z.boolean().optional(),
});

export const scholarshipIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const listScholarshipsQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CreateScholarshipInput = z.infer<typeof createScholarshipSchema>;
export type UpdateScholarshipInput = z.infer<typeof updateScholarshipSchema>;
export type ListScholarshipsQuery  = z.infer<typeof listScholarshipsQuerySchema>;