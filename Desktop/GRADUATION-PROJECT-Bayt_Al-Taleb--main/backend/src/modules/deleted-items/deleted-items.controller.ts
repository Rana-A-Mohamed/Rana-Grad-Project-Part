import type { Request, Response } from 'express';
import type { DeletedItemsService } from './deleted-items.service.js';
import type { QueueQuery } from './deleted-items.validation.js';
import type { AuditEntityType } from '@prisma/client';
import { ok, noContent } from '../../shared/utils/http-response.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export class DeletedItemsController {
  constructor(private readonly service: DeletedItemsService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.list(req.query as unknown as QueueQuery);
    ok(res, result);
  });

  restore = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params as { entityType: AuditEntityType; entityId: string };
    await this.service.restore(entityType, entityId, req.user!.id);
    noContent(res);
  });

  permanentDelete = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params as { entityType: AuditEntityType; entityId: string };
    await this.service.permanentDelete(entityType, entityId);
    noContent(res);
  });
}