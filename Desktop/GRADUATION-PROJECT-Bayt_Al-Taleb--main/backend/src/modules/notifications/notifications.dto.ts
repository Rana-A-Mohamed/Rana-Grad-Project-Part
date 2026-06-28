/** API response shape for a single notification (createdAt serialised to ISO string). */
export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: unknown;
  createdAt: string;
}

/** API response shape for the unread-count endpoint. */
export interface UnreadCountDto {
  unreadCount: number;
}
