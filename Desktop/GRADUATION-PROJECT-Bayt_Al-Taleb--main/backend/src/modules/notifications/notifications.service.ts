import type { RoleName } from '@prisma/client';
import { logger } from '../../infrastructure/logger/logger.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import type { Paginated } from '../../shared/types/index.js';
import type { NotificationsRepository } from './notifications.repository.js';
import type { CreateNotificationData, NotificationView } from './notifications.types.js';
import type { CreateAnnouncementInput } from './notifications.validation.js';

/**
 * Result of `createAnnouncement`:
 * - WITH targetRole → broadcast to all users of that role
 * - WITHOUT targetRole → self-addressed notification for the acting admin
 */
export type BroadcastResult =
  | { broadcast: true; targetRole: RoleName; sent: number }
  | { broadcast: false; sent: 1 };

/**
 * NotificationService — in-app notifications.
 *
 * `notifyUser` / `notifyRole` are fire-and-forget helpers that other modules
 * call (Reviews → approve/reject, Users → role change). They MUST catch all
 * errors, log them, and return void/0 — a notification failure must never break
 * the triggering business action.
 *
 * User-facing operations (`list`, `markRead`, etc.) surface errors normally.
 */
export class NotificationService {
  constructor(private readonly repo: NotificationsRepository) {}

  // ── Fire-and-forget helpers ───────────────────────────────────

  /** Persist a notification for a single user. Never throws. */
  async notifyUser(data: CreateNotificationData): Promise<void> {
    try {
      await this.repo.create(data);
    } catch (err) {
      logger.error({ err, userId: data.userId, title: data.title }, 'Failed to persist notification');
    }
  }

  /**
   * Broadcast a notification to every active user holding `role`. Never throws.
   * Returns the number of notifications sent, or 0 on failure.
   */
  async notifyRole(
    role: RoleName,
    data: Omit<CreateNotificationData, 'userId'>,
  ): Promise<number> {
    try {
      const userIds = await this.repo.findUserIdsByRole(role);
      if (userIds.length === 0) return 0;
      return await this.repo.createMany(userIds, data);
    } catch (err) {
      logger.error({ err, role, title: data.title }, 'Failed to broadcast notification to role');
      return 0;
    }
  }

  // ── User-facing operations (CAN throw) ────────────────────────

  /** Paginated notification list for the authenticated user. */
  async list(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<NotificationView>> {
    const { items, total } = await this.repo.listForUser(userId, page, pageSize);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** Unread notification count for a user. */
  async unreadCount(userId: string): Promise<number> {
    return this.repo.unreadCount(userId);
  }

  /**
   * Mark a single notification as read.
   * - No-op if the notification exists but is already read.
   * - Throws NotFoundError if the notification does not belong to the user.
   */
  async markRead(userId: string, notifId: string): Promise<void> {
    const updated = await this.repo.markRead(userId, notifId);
    if (!updated) {
      const exists = await this.repo.existsForUser(userId, notifId);
      if (!exists) {
        throw new NotFoundError('Notification not found');
      }
      // Already read — no-op, don't throw.
    }
  }

  /** Mark all unread notifications as read. Returns the count updated. */
  async markAllRead(userId: string): Promise<number> {
    return this.repo.markAllRead(userId);
  }

  /**
   * Create an announcement.
   * - WITH targetRole: broadcast to every user of that role via createMany.
   * - WITHOUT targetRole: self-addressed notification for the acting admin.
   */
  async createAnnouncement(
    actorId: string,
    input: CreateAnnouncementInput,
  ): Promise<BroadcastResult> {
    if (input.targetRole) {
      const userIds = await this.repo.findUserIdsByRole(input.targetRole);
      const sent = await this.repo.createMany(userIds, {
        title: input.title,
        message: input.message,
      });
      return { broadcast: true, targetRole: input.targetRole, sent };
    }

    await this.repo.create({
      userId: actorId,
      title: input.title,
      message: input.message,
    });
    return { broadcast: false, sent: 1 as const };
  }
}