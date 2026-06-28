import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import type { NotificationsController } from './notifications.controller.js';
import {
  createAnnouncementSchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from './notifications.validation.js';

/**
 * Notification routes. Mounted at `/api/v1/notifications`.
 *
 *   GET   /               list (paginated)
 *   GET   /unread-count   unread count
 *   PATCH /read-all       mark all as read
 *   PATCH /:id/read       mark single as read
 *   POST  /               create announcement (ADMIN / SUPER_ADMIN only)
 *
 * ⚠️ Static routes (/unread-count, /read-all) are declared BEFORE /:id/read
 *    so Express doesn't match "unread-count" or "read-all" as an :id param.
 */
export function createNotificationsRouter(
  controller: NotificationsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/',
    authenticate,
    validate({ query: listNotificationsQuerySchema }),
    controller.list,
  );

  router.get(
    '/unread-count',
    authenticate,
    controller.getUnreadCount,
  );

  router.patch(
    '/read-all',
    authenticate,
    controller.markAllRead,
  );

  router.patch(
    '/:id/read',
    authenticate,
    validate({ params: notificationIdParamsSchema }),
    controller.markRead,
  );

  router.post(
    '/',
    authenticate,
    requireRole('ADMIN', 'SUPER_ADMIN'),
    validate({ body: createAnnouncementSchema }),
    controller.createAnnouncement,
  );

  return router;
}
