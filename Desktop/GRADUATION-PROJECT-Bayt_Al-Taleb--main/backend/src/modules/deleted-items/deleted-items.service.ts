import type { PrismaClient, AuditEntityType } from '@prisma/client';
import type { DeletedItemDto } from './deleted-items.dto.js';
import type { QueueQuery } from './deleted-items.validation.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/app-error.js';

export type RestoreHook = (entityId: string, restoredById: string) => Promise<void>;

export class DeletedItemsService {
  private readonly restoreHooks = new Map<AuditEntityType, RestoreHook>();

  constructor(private readonly db: PrismaClient) {}

  registerRestoreHook(entityType: AuditEntityType, hook: RestoreHook): void {
    this.restoreHooks.set(entityType, hook);
  }

  // ─── List deleted queue ───────────────────────────────────────

  async list(query: QueueQuery): Promise<{ items: DeletedItemDto[]; total: number; page: number; limit: number }> {
    const skip  = (query.page - 1) * query.limit;
    const items: DeletedItemDto[] = [];
    let total = 0;

    if (!query.entityType || query.entityType === 'MAJOR') {
      const majors = await this.db.major.findMany({
        where: { deletedAt: { not: null } },
        skip, take: query.limit,
      });
      majors.forEach(m => items.push({ id: m.id, entityType: 'MAJOR', name: m.name, deletedAt: m.deletedAt!, deletedById: m.deletedById, deleteReason: m.deleteReason }));
      total += await this.db.major.count({ where: { deletedAt: { not: null } } });
    }

    if (!query.entityType || query.entityType === 'SCHOLARSHIP') {
      const scholarships = await this.db.scholarship.findMany({
        where: { deletedAt: { not: null } },
        skip, take: query.limit,
      });
      scholarships.forEach(s => items.push({ id: s.id, entityType: 'SCHOLARSHIP', name: s.name, deletedAt: s.deletedAt!, deletedById: s.deletedById, deleteReason: s.deleteReason }));
      total += await this.db.scholarship.count({ where: { deletedAt: { not: null } } });
    }

    return { items, total, page: query.page, limit: query.limit };
  }

  // ─── Restore ─────────────────────────────────────────────────

  async restore(entityType: AuditEntityType, entityId: string, restoredById: string): Promise<void> {
    await this.#assertExists(entityType, entityId);

    if (entityType === 'MAJOR') {
      await this.db.major.update({ where: { id: entityId }, data: { deletedAt: null, deletedById: null, deleteReason: null } });
    } else if (entityType === 'SCHOLARSHIP') {
      await this.db.scholarship.update({ where: { id: entityId }, data: { deletedAt: null, deletedById: null, deleteReason: null } });
    } else {
      throw new BadRequestError(`Restore not supported for ${entityType}`);
    }

    const hook = this.restoreHooks.get(entityType);
    if (hook) await hook(entityId, restoredById);
  }

  // ─── Permanent delete ─────────────────────────────────────────

  async permanentDelete(entityType: AuditEntityType, entityId: string): Promise<void> {
    await this.#assertExists(entityType, entityId);

    if (entityType === 'MAJOR') {
      await this.db.major.delete({ where: { id: entityId } });
    } else if (entityType === 'SCHOLARSHIP') {
      await this.db.scholarship.delete({ where: { id: entityId } });
    } else {
      throw new BadRequestError(`Permanent delete not supported for ${entityType}`);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────

  async #assertExists(entityType: AuditEntityType, entityId: string): Promise<void> {
    let exists = false;
    if (entityType === 'MAJOR') {
      const item = await this.db.major.findFirst({ where: { id: entityId, deletedAt: { not: null } } });
      exists = item !== null;
    } else if (entityType === 'SCHOLARSHIP') {
      const item = await this.db.scholarship.findFirst({ where: { id: entityId, deletedAt: { not: null } } });
      exists = item !== null;
    }
    if (!exists) throw new NotFoundError(`Deleted ${entityType} ${entityId} not found`);
  }
}