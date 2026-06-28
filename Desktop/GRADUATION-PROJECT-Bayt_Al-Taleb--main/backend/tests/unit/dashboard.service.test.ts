import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditAction, AuditEntityType, FileStatus, FileType } from '@prisma/client';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service.js';
import type { DashboardRepository } from '../../src/modules/dashboard/dashboard.repository.js';
import type { DeletedItemsService } from '../../src/modules/deleted-items/deleted-items.service.js';
import type { DashboardCounts } from '../../src/modules/dashboard/dashboard.types.js';
import type { DeletedItem } from '../../src/shared/soft-delete/soft-delete.js';

const counts = (over: Partial<DashboardCounts> = {}): DashboardCounts => ({
  totalUsers: 5,
  totalMajors: 3,
  totalColleges: 2,
  totalScholarships: 4,
  totalFiles: 10,
  pendingFiles: 6,
  approvedFiles: 3,
  rejectedFiles: 1,
  totalContactMessages: 8,
  unhandledContactMessages: 2,
  ...over,
});

const deletedItem = (id: string, when: string): DeletedItem => ({
  entityType: AuditEntityType.MAJOR,
  id,
  label: `Major ${id}`,
  deletedAt: new Date(when),
  deletedById: 'admin_1',
  deleteReason: null,
});

describe('DashboardService', () => {
  let repo: DashboardRepository;
  let deletedItems: DeletedItemsService;
  let service: DashboardService;

  beforeEach(() => {
    repo = {
      getCounts: vi.fn().mockResolvedValue(counts()),
      recentUploads: vi.fn().mockResolvedValue([]),
      recentAuditLogs: vi.fn().mockResolvedValue([]),
      recentContactMessages: vi.fn().mockResolvedValue([]),
    } as unknown as DashboardRepository;
    deletedItems = {
      listQueue: vi.fn().mockResolvedValue([]),
    } as unknown as DeletedItemsService;
    service = new DashboardService(repo, deletedItems);
  });

  describe('getStats', () => {
    it('merges active counts with the deleted-items count', async () => {
      vi.mocked(deletedItems.listQueue).mockResolvedValue([
        deletedItem('a', '2026-01-01'),
        deletedItem('b', '2026-01-02'),
      ]);

      const stats = await service.getStats();

      expect(stats).toMatchObject({
        totalUsers: 5,
        totalMajors: 3,
        totalColleges: 2,
        totalScholarships: 4,
        totalFiles: 10,
        pendingFiles: 6,
        approvedFiles: 3,
        rejectedFiles: 1,
        totalContactMessages: 8,
        unhandledContactMessages: 2,
        deletedItems: 2, // from the deleted-items system, not a raw count
      });
    });

    it('reports zero deleted items when the queue is empty', async () => {
      const stats = await service.getStats();
      expect(stats.deletedItems).toBe(0);
      expect(repo.getCounts).toHaveBeenCalledOnce();
    });
  });

  describe('getRecentActivity', () => {
    it('composes the four feeds from repo + deleted-items system', async () => {
      vi.mocked(repo.recentUploads).mockResolvedValue([
        {
          id: 'file_1',
          title: 'Notes',
          type: FileType.SUMMARY,
          status: FileStatus.PENDING,
          ownerType: 'MAJOR',
          ownerId: 'maj_1',
          uploadedById: 'usr_1',
          createdAt: new Date('2026-02-01'),
        },
      ]);
      vi.mocked(repo.recentAuditLogs).mockResolvedValue([
        {
          id: 'a1',
          userId: 'usr_1',
          action: AuditAction.CREATE,
          entityType: AuditEntityType.FILE,
          entityId: 'file_1',
          createdAt: new Date('2026-02-02'),
        },
      ]);
      vi.mocked(repo.recentContactMessages).mockResolvedValue([
        {
          id: 'c1',
          name: 'Sara',
          email: 's@x.io',
          subject: 'Hi',
          isHandled: false,
          createdAt: new Date('2026-02-03'),
        },
      ]);
      vi.mocked(deletedItems.listQueue).mockResolvedValue([deletedItem('m1', '2026-02-04')]);

      const activity = await service.getRecentActivity();

      expect(activity.recentUploads).toHaveLength(1);
      expect(activity.recentAuditLogs[0]?.action).toBe(AuditAction.CREATE);
      expect(activity.recentContactMessages[0]?.name).toBe('Sara');
      expect(activity.recentDeletedItems[0]).toMatchObject({ id: 'm1', label: 'Major m1' });
    });

    it('trims recent deleted items to the latest 10', async () => {
      const queue = Array.from({ length: 15 }, (_, i) =>
        deletedItem(`d${i}`, `2026-03-${String(i + 1).padStart(2, '0')}`),
      );
      vi.mocked(deletedItems.listQueue).mockResolvedValue(queue);

      const activity = await service.getRecentActivity();
      expect(activity.recentDeletedItems).toHaveLength(10);
      // queue is already newest-first; the trim keeps the first 10.
      expect(activity.recentDeletedItems[0]?.id).toBe('d0');
    });
  });
});
