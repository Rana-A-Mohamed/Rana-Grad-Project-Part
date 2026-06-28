import { ReviewAction } from '@prisma/client';
import { z } from 'zod';

export const fileReviewParamsSchema = z.object({
  fileId: z.string().cuid(),
});

export const createReviewSchema = z.object({
  /** Field is `action`, NOT `decision`. Uses z.nativeEnum, NOT z.enum([...]). */
  action: z.nativeEnum(ReviewAction),
  comment: z.string().min(1).max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
