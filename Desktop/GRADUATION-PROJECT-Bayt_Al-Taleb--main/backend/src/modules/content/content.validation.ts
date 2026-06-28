import { z } from 'zod';

export const createSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const createFaqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type CreateFaqInput = z.infer<typeof createFaqSchema>;
