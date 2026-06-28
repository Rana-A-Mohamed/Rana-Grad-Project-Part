import { z } from 'zod';
import { AuditEntityType } from '@prisma/client';

export const queueQuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.nativeEnum(AuditEntityType).optional(),
});

export const deletedItemParamsSchema = z.object({
  entityType: z.nativeEnum(AuditEntityType),
  entityId:   z.string().min(1),
});

export const permanentDeleteBodySchema = z.object({
  confirm: z.literal(true, { errorMap: () => ({ message: 'Must confirm permanent deletion' }) }),
});

export type QueueQuery           = z.infer<typeof queueQuerySchema>;
export type PermanentDeleteInput = z.infer<typeof permanentDeleteBodySchema>;