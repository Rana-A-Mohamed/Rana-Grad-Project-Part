import type { Notification, Prisma, RoleName } from '@prisma/client';
import type { Database } from '../../infrastructure/database/prisma.js';
import type { CreateNotificationData, NotificationView } from './notifications.types.js';

/** Map a Prisma Notification row to the domain NotificationView. */
function toView(row: Notification): NotificationView {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    isRead: row.isRead,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

/** Data-access for notifications. The only layer touching Prisma here. */
export class NotificationsRepository {
  constructor(private readonly db: Database) {}

  async create(data: CreateNotificationData): Promise<NotificationView> {
    const row = await this.db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        metadata: data.metadata != null
          ? (data.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return toView(row);
  }

  /**
   * Bulk insert for role broadcast. Accepts a list of target user IDs and
   * a shared notification payload. Returns the count of created rows.
   */
  async createMany(
    userIds: string[],
    data: Omit<CreateNotificationData, 'userId'>,
  ): Promise<number> {
    const result = await this.db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: data.title,
        message: data.message,
        metadata: data.metadata != null
          ? (data.metadata as Prisma.InputJsonValue)
          : undefined,
      })),
    });
    return result.count;
  }

  /** Paginated list for one user, newest first. */
  async listForUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: NotificationView[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.db.notification.count({ where: { userId } }),
    ]);
    return { items: items.map(toView), total };
  }

  /** Count of unread notifications for a user. */
  async unreadCount(userId: string): Promise<number> {
    return this.db.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a single notification read. Returns false if not found, not owned
   * by userId, OR already read (but the record still exists).
   */
  async markRead(userId: string, notifId: string): Promise<boolean> {
    const result = await this.db.notification.updateMany({
      where: { id: notifId, userId, isRead: false },
      data: { isRead: true },
    });
    return result.count > 0;
  }

  /**
   * Check whether a notification with the given id exists for the user,
   * regardless of read state. Used to distinguish "already read" from
   * "not found / not yours" when markRead returns false.
   */
  async existsForUser(userId: string, notifId: string): Promise<boolean> {
    const row = await this.db.notification.findFirst({
      where: { id: notifId, userId },
      select: { id: true },
    });
    return row !== null;
  }

  /** Mark all of a user's notifications read. Returns the count updated. */
  async markAllRead(userId: string): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  /** Find all active user IDs that hold a given role (used for role broadcast). */
  async findUserIdsByRole(role: RoleName): Promise<string[]> {
    const users = await this.db.user.findMany({
      where: { role: { name: role }, isActive: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}