import type { AuditLog, Prisma } from '@prisma/client';
import type { Database } from '../../infrastructure/database/prisma.js';
import type { AuditEntry, AuditLogFilter, AuditLogView } from './audit.types.js';

/** Map a Prisma AuditLog row to the domain AuditLogView. */
function toView(row: AuditLog): AuditLogView {
  return {
    id: row.id,
    userId: row.userId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    reason: row.reason,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

/** Build a Prisma `where` clause from the optional filter fields. */
function buildWhere(filter: AuditLogFilter): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (filter.entityType != null) where.entityType = filter.entityType;
  if (filter.entityId != null) where.entityId = filter.entityId;
  if (filter.action != null) where.action = filter.action;
  if (filter.userId != null) where.userId = filter.userId;
  return where;
}

/** Append-only data-access for audit logs. The only layer touching Prisma here. */
export class AuditRepository {
  constructor(private readonly db: Database) {}

  /** Insert a new audit log entry. Returns the created row. */
  async create(entry: AuditEntry): Promise<AuditLogView> {
    const row = await this.db.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        reason: entry.reason ?? null,
        metadata: entry.metadata != null
          ? (entry.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return toView(row);
  }

  /** Paginated list, newest first, with optional filters. */
  async list(
    filter: AuditLogFilter,
    page: number,
    pageSize: number,
  ): Promise<{ items: AuditLogView[]; total: number }> {
    const where = buildWhere(filter);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return { items: items.map(toView), total };
  }
}
