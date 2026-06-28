import { z } from 'zod';

export const submitContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
});

export const contactIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const listContactQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>;
export type ListContactQuery = z.infer<typeof listContactQuerySchema>;
