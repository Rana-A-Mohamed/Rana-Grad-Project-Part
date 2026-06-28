/** Internal domain representation of a stored notification (maps from the DB row). */
export interface NotificationView {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: unknown;
  createdAt: Date;
}

/** Input shape for persisting a new notification (no id, isRead, or createdAt). */
export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  metadata?: unknown;
}
