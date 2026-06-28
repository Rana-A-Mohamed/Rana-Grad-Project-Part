import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { paginated } from '../../shared/utils/http-response.js';
import type { AuditService } from './audit.service.js';
import type { AuditLogFilter } from './audit.types.js';
import type { ListAuditQuery } from './audit.validation.js';

export class AuditController {
  constructor(private readonly service: AuditService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAuditQuery;

    const filter: AuditLogFilter = {};
    if (query.entityType != null) filter.entityType = query.entityType;
    if (query.entityId   != null) filter.entityId   = query.entityId;
    if (query.action     != null) filter.action      = query.action;
    if (query.userId     != null) filter.userId      = query.userId;

    const result = await this.service.list(filter, query.page, query.pageSize);
    paginated(res, result);
  });
}
