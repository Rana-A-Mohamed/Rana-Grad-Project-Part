import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { created, noContent, ok, paginated } from '../../shared/utils/http-response.js';
import { param } from '../../shared/utils/params.js';
import type { NotificationService } from './notifications.service.js';
import type { CreateAnnouncementInput, ListNotificationsQuery } from './notifications.validation.js';

export class NotificationsController {
  constructor(private readonly service: NotificationService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { page, pageSize } = req.query as unknown as ListNotificationsQuery;
    const result = await this.service.list(userId, page, pageSize);
    paginated(res, result);
  });

  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await this.service.unreadCount(req.user!.id);
    ok(res, { unreadCount: count });
  });

  markAllRead = asyncHandler(async (req: Request, res: Response) => {
    const updated = await this.service.markAllRead(req.user!.id);
    ok(res, { updated });
  });

  markRead = asyncHandler(async (req: Request, res: Response) => {
    await this.service.markRead(req.user!.id, param(req, 'id'));
    noContent(res);
  });

  createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.createAnnouncement(
      req.user!.id,
      req.body as CreateAnnouncementInput,
    );
    created(res, result);
  });
}