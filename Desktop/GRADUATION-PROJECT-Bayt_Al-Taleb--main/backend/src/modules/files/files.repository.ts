import type { File, Prisma } from '@prisma/client';
import { AuditEntityType, FileOwnerType, FileStatus } from '@prisma/client';
import type { Database } from '../../infrastructure/database/prisma.js';
import { notDeleted } from '../../shared/soft-delete/soft-delete.js';
import type { DeletedItem, SoftDeletableRepository } from '../../shared/soft-delete/soft-delete.js';
import type { Paginated } from '../../shared/types/index.js';
import type { FileView, FileListFilter, UploadFileData } from './files.types.js';

/**
 * FilesRepository — all Prisma interaction for the File model.
 * Maps raw Prisma rows to `FileView` so no Prisma types leak beyond this class.
 * Implements `SoftDeletableRepository` for integration with DeletedItemsService.
 */
export class FilesRepository implements SoftDeletableRepository {
  readonly entityType = AuditEntityType.FILE;

  constructor(private readonly db: Database) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  private toView(row: File): FileView {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      type: row.type,
      status: row.status,
      storageKey: row.storageKey,
      mimeType: row.mimeType ?? null,
      sizeBytes: row.sizeBytes ?? null,
      ownerType: row.ownerType,
      ownerId: row.ownerId,
      uploadedById: row.uploadedById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    };
  }

  // ── Write operations ───────────────────────────────────────────────────────

  async create(data: UploadFileData): Promise<FileView> {
    const row = await this.db.file.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        type: data.type,
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        uploadedById: data.uploadedById ?? '',
        storageKey: data.storageKey,
        mimeType: data.mimeType ?? null,
        sizeBytes: data.sizeBytes ?? null,
        status: data.status ?? FileStatus.PENDING,
      },
    });
    return this.toView(row);
  }

  async updateStatus(id: string, status: FileStatus): Promise<FileView> {
    const row = await this.db.file.update({
      where: { id },
      data: { status },
    });
    return this.toView(row);
  }

  // ── Read operations ────────────────────────────────────────────────────────

  async findById(id: string): Promise<FileView | null> {
    const row = await this.db.file.findFirst({
      where: { id, ...notDeleted },
    });
    return row ? this.toView(row) : null;
  }

  async findMany(filter: FileListFilter): Promise<Paginated<FileView>> {
    const where: Prisma.FileWhereInput = { ...notDeleted };

    if (filter.ownerType !== undefined) where.ownerType = filter.ownerType;
    if (filter.ownerId !== undefined) where.ownerId = filter.ownerId;
    if (filter.status !== undefined) where.status = filter.status;
    if (filter.type !== undefined) where.type = filter.type;
    if (filter.uploadedById !== undefined) where.uploadedById = filter.uploadedById;

    const skip = (filter.page - 1) * filter.pageSize;

    const [rows, total] = await Promise.all([
      this.db.file.findMany({
        where,
        skip,
        take: filter.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.file.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toView(r)),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
      totalPages: Math.ceil(total / filter.pageSize),
    };
  }

  /**
   * All non-deleted files for a specific owner (ownerType + ownerId pair).
   */
  async listByOwner(ownerType: FileOwnerType, ownerId: string): Promise<FileView[]> {
    const rows = await this.db.file.findMany({
      where: { ownerType, ownerId, ...notDeleted },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toView(r));
  }

  /**
   * Approved non-deleted files for a specific owner (ownerType + ownerId).
   */
  async findApprovedByOwner(ownerType: FileOwnerType, ownerId: string): Promise<FileView[]> {
    const rows = await this.db.file.findMany({
      where: { ownerType, ownerId, status: FileStatus.APPROVED, ...notDeleted },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toView(r));
  }

  // ── SoftDeletableRepository ────────────────────────────────────────────────

  async softDelete(
    id: string,
    deletedById: string,
    reason: string | null,
  ): Promise<boolean> {
    const existing = await this.db.file.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) return false;

    await this.db.file.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
        deleteReason: reason,
      },
    });
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const existing = await this.db.file.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!existing) return false;

    await this.db.file.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        deleteReason: null,
      },
    });
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const existing = await this.db.file.findFirst({ where: { id } });
    if (!existing) return false;

    await this.db.file.delete({ where: { id } });
    return true;
  }

  async listDeleted(): Promise<DeletedItem[]> {
    const rows = await this.db.file.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });

    return rows.map((row) => ({
      entityType: AuditEntityType.FILE,
      id: row.id,
      label: row.title,
      deletedAt: row.deletedAt as Date,
      deletedById: row.deletedById ?? null,
      deleteReason: row.deleteReason ?? null,
    }));
  }
}
