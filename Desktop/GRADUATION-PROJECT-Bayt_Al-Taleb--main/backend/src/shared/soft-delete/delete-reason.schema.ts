import { z } from 'zod';

/**
 * Shared request-body schema for soft-delete endpoints. The reason is optional
 * but recorded on the row and in the audit log when provided.
 */
export const deleteReasonBodySchema = z.object({
  reason: z.string().max(2000).optional(),
});

export type DeleteReasonInput = z.infer<typeof deleteReasonBodySchema>;
