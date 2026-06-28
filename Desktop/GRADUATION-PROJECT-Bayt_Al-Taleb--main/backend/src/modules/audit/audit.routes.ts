import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import type { AuditController } from './audit.controller.js';
import { listAuditQuerySchema } from './audit.validation.js';

/**
 * Audit log routes. Mounted at `/api/v1/audit-logs`.
 * Read-only; restricted to ADMIN and SUPER_ADMIN.
 *
 *   GET / — paginated, filterable audit trail
 */
export function createAuditRouter(
  controller: AuditController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/',
    authenticate,
    requireRole('ADMIN', 'SUPER_ADMIN'),
    validate({ query: listAuditQuerySchema }),
    controller.list,
  );

  return router;
}
