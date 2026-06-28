import type { AuditAction, AuditEntityType } from '@prisma/client';

/** Input shape callers pass to AuditService.log(). */
export interface AuditEntry {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  reason?: string;
  metadata?: unknown;
}

/** Internal domain representation of a stored audit log row. */
export interface AuditLogView {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  reason: string | null;
  metadata: unknown;
  createdAt: Date;
}

/** Optional filters for paginated audit log queries. */
export interface AuditLogFilter {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
}
