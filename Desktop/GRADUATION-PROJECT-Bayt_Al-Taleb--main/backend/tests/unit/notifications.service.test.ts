import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleName, type Notification } from '@prisma/client';
import { NotificationService } from '../../src/modules/notifications/notifications.service.js';
import type { NotificationsRepository } from '../../src/modules/notifications/notifications.repository.js';
import { NotFoundError } from '../../src/shared/errors/app-error.js';

const makeNotif = (over: Partial<Notification> = {}): Notification => ({
  id: 'ntf_1',
  userId: 'usr_1',
  title: 'Hi',
  message: 'Body',
  isRead: false,
  metadata: null,
  createdAt: new Date('2026-01-01'),
  ...over,
});

describe('NotificationService', () => {
  let repo: NotificationsRepository;
  let service: NotificationService;

  beforeEach(() => {
    repo = {
      create: vi.fn().mockResolvedValue(makeNotif()),
      createMany: vi.fn().mockResolvedValue(0),
      listForUser: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      unreadCount: vi.fn().mockResolvedValue(0),
      markRead: vi.fn().mockResolvedValue(true),
      markAllRead: vi.fn().mockResolvedValue(0),
      existsForUser: vi.fn().mockResolvedValue(true),
      findUserIdsByRole: vi.fn().mockResolvedValue([]),
    } as unknown as NotificationsRepository;
    service = new NotificationService(repo);
  });

  describe('notifyUser', () => {
    it('creates a notification for a user', async () => {
      await service.notifyUser({ userId: 'usr_1', title: 'T', message: 'M' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'usr_1', title: 'T', message: 'M' }),
      );
    });

    it('never throws if persistence fails (action already succeeded)', async () => {
      vi.mocked(repo.create).mockRejectedValue(new Error('db down'));
      await expect(
        service.notifyUser({ userId: 'usr_1', title: 'T', message: 'M' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyRole (broadcast)', () => {
    it('broadcasts to every user holding the role', async () => {
      vi.mocked(repo.findUserIdsByRole).mockResolvedValue(['u1', 'u2', 'u3']);
      vi.mocked(repo.createMany).mockResolvedValue(3);
      const sent = await service.notifyRole(RoleName.MODERATOR, { title: 'T', message: 'M' });
      expect(repo.findUserIdsByRole).toHaveBeenCalledWith(RoleName.MODERATOR);
      expect(repo.createMany).toHaveBeenCalledWith(['u1', 'u2', 'u3'], expect.any(Object));
      expect(sent).toBe(3);
    });

    it('returns 0 (never throws) if the broadcast fails', async () => {
      vi.mocked(repo.findUserIdsByRole).mockRejectedValue(new Error('db down'));
      await expect(service.notifyRole(RoleName.ADMIN, { title: 'T', message: 'M' })).resolves.toBe(0);
    });
  });

  describe('list / unreadCount', () => {
    it('maps a paginated list to views', async () => {
      vi.mocked(repo.listForUser).mockResolvedValue({ items: [makeNotif()], total: 1 });
      const { items, total } = await service.list('usr_1', 1, 20);
      expect(total).toBe(1);
      expect(items[0]?.title).toBe('Hi');
    });

    it('returns the unread count', async () => {
      vi.mocked(repo.unreadCount).mockResolvedValue(4);
      expect(await service.unreadCount('usr_1')).toBe(4);
    });
  });

  describe('markRead', () => {
    it('marks an owned notification read', async () => {
      await service.markRead('usr_1', 'ntf_1');
      expect(repo.markRead).toHaveBeenCalledWith('usr_1', 'ntf_1');
    });

    it('is a no-op when already read (still exists)', async () => {
      vi.mocked(repo.markRead).mockResolvedValue(false);
      vi.mocked(repo.existsForUser).mockResolvedValue(true);
      await expect(service.markRead('usr_1', 'ntf_1')).resolves.toBeUndefined();
    });

    it('throws NotFoundError when the notification is not the user’s', async () => {
      vi.mocked(repo.markRead).mockResolvedValue(false);
      vi.mocked(repo.existsForUser).mockResolvedValue(false);
      await expect(service.markRead('usr_1', 'missing')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('markAllRead', () => {
    it('marks all unread notifications read and returns the count', async () => {
      vi.mocked(repo.markAllRead).mockResolvedValue(5);
      expect(await service.markAllRead('usr_1')).toBe(5);
    });
  });
});
