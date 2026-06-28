import type { AuditEntityType } from '@prisma/client';

/** The soft-delete columns every soft-deletable row carries. */
export interface SoftDeleteFields {
  deletedAt: Date | null;
  deletedById: string | null;
  deleteReason: string | null;
}

/** A row in the deleted-items queue, normalized across entity types. */
export interface DeletedItem {
  entityType: AuditEntityType;
  id: string;
  /** A short human label for the deleted record (e.g. major name, file title). */
  label: string;
  deletedAt: Date;
  deletedById: string | null;
  deleteReason: string | null;
}

/**
 * Contract a repository implements to participate in the soft-delete lifecycle
 * and the deleted-items queue. Each soft-deletable module's repository
 * implements this and is registered with DeletedItemsService, mirroring how
 * owner modules register checkers with ContentService/FilesService.
 */
export interface SoftDeletableRepository {
  /** The audit/queue entity kind this repository manages. */
  readonly entityType: AuditEntityType;
  /** Mark a row deleted. Returns false if the row does not exist / already deleted. */
  softDelete(id: string, deletedById: string, reason: string | null): Promise<boolean>;
  /** Clear soft-delete fields. Returns false if not currently deleted. */
  restore(id: string): Promise<boolean>;
  /** Physically remove a soft-deleted row. Returns false if not found. */
  hardDelete(id: string): Promise<boolean>;
  /** All currently soft-deleted rows, normalized for the queue. */
  listDeleted(): Promise<DeletedItem[]>;
}

/** Prisma `where` fragment that selects only NON-deleted rows. */
export const notDeleted = { deletedAt: null } as const;
