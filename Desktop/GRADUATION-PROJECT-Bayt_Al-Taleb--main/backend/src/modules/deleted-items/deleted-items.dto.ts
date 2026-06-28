import type { AuditEntityType } from '@prisma/client';

export interface DeletedItemDto {
  id: string;
  entityType: AuditEntityType;
  name: string;
  deletedAt: Date;
  deletedById: string | null;
  deleteReason: string | null;
}