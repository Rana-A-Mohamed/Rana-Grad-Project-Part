import { z } from 'zod';
import { AuditAction, AuditEntityType } from '@prisma/client';

export const listAuditQuerySchema = z.object({
  entityType: z.nativeEnum(AuditEntityType).optional(),
  entityId: z.string().cuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  userId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
