import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { DeletedItemsService } from '../../src/modules/deleted-items/deleted-items.service.js';
import type {
  DeletedItem,
  SoftDeletableRepository,
} from '../../src/shared/soft-delete/soft-delete.js';
import { BadRequestError, NotFoundError } from '../../src/shared/errors/app-error.js';
import { SUPER_ADMIN_ACTOR, makeAudit } from '../mocks/fakes.js';

/** DeletedItemsService unit tests — queue, restore, permanent delete. */
describe('DeletedItemsService', () => {
  let majorRepo: SoftDeletableRepository;
  let fileRepo: SoftDeletableRepository;
  let service: DeletedItemsService;
  let auditRepo: { create: ReturnType<typeof vi.fn> };

  const majorItem: DeletedItem = {
    entityType: AuditEntityType.MAJOR,
    id: 'maj_1',
    label: 'Nursing',
    deletedAt: new Date('2026-02-01T00:00:00Z'),
    deletedById: 'admin_1',
    deleteReason: 'duplicate',
  };
  const fileItem: DeletedItem = {
    entityType: AuditEntityType.FILE,
    id: 'file_1',
    label: 'Exam.pdf',
    deletedAt: new Date('2026-03-01T00:00:00Z'),
    deletedById: 'admin_1',
    deleteReason: null,
  };

  beforeEach(() => {
    majorRepo = {
      entityType: AuditEntityType.MAJOR,
      softDelete: vi.fn(),
      restore: vi.fn().mockResolvedValue(true),
      hardDelete: vi.fn().mockResolvedValue(true),
      listDeleted: vi.fn().mockResolvedValue([majorItem]),
    };
    fileRepo = {
      entityType: AuditEntityType.FILE,
      softDelete: vi.fn(),
      restore: vi.fn().mockResolvedValue(true),
      hardDelete: vi.fn().mockResolvedValue(true),
      listDeleted: vi.fn().mockResolvedValue([fileItem]),
    };
    const audit = makeAudit();
    auditRepo = audit.auditRepo;
    service = new DeletedItemsService(audit.audit);
    service.register(majorRepo);
    service.register(fileRepo);
  });

  describe('queue', () => {
    it('aggregates deleted items across all repos, newest first', async () => {
      const queue = await service.listQueue();
      expect(queue.map((q) => q.id)).toEqual(['file_1', 'maj_1']); // file deleted later
      // Each entry carries item + who + when + reason.
      expect(queue[1]).toMatchObject({
        id: 'maj_1',
        deletedById: 'admin_1',
        deleteReason: 'duplicate',
      });
    });

    it('filters the queue by entity type', async () => {
      const queue = await service.listQueue(AuditEntityType.MAJOR);
      expect(queue).toHaveLength(1);
      expect(fileRepo.listDeleted).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('restores an item and audits RESTORE', async () => {
      await service.restore(SUPER_ADMIN_ACTOR, AuditEntityType.MAJOR, 'maj_1');
      expect(majorRepo.restore).toHaveBeenCalledWith('maj_1');
      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.RESTORE, entityId: 'maj_1' }),
      );
    });

    it('throws NotFoundError if nothing was restored', async () => {
      vi.mocked(majorRepo.restore).mockResolvedValue(false);
      await expect(
        service.restore(SUPER_ADMIN_ACTOR, AuditEntityType.MAJOR, 'missing'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('permanent delete', () => {
    it('hard-deletes an item and audits DELETE with permanent flag', async () => {
      await service.permanentlyDelete(SUPER_ADMIN_ACTOR, AuditEntityType.FILE, 'file_1', 'gdpr');
      expect(fileRepo.hardDelete).toHaveBeenCalledWith('file_1');
      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.DELETE,
          entityId: 'file_1',
          metadata: { permanent: true },
        }),
      );
    });

    it('throws NotFoundError if nothing was deleted', async () => {
      vi.mocked(fileRepo.hardDelete).mockResolvedValue(false);
      await expect(
        service.permanentlyDelete(SUPER_ADMIN_ACTOR, AuditEntityType.FILE, 'missing', null),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  it('rejects an unregistered entity type', async () => {
    await expect(
      service.restore(SUPER_ADMIN_ACTOR, AuditEntityType.SECTION, 'x'),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
