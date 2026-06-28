import { Router } from 'express';
import type { DeletedItemsController } from './deleted-items.controller.js';
import type { TokenService } from '../auth/auth.types.js';
import { authenticate } from '../../infrastructure/http/middlewares/auth.middleware.js';
import { requirePermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { PERMISSIONS } from '../../shared/rbac/permissions.js';
import { queueQuerySchema, deletedItemParamsSchema, permanentDeleteBodySchema } from './deleted-items.validation.js';

/**
 * Deleted items routes — mounted at /api/v1/deleted-items
 *
 *   GET    /                          list deleted queue   (majors:manage)
 *   POST   /:entityType/:entityId/restore   restore item  (majors:manage)
 *   DELETE /:entityType/:entityId           permanent delete (majors:manage)
 */
export function createDeletedItemsRouter(controller: DeletedItemsController, tokenService: TokenService): Router {
  const router = Router();
  const auth   = authenticate(tokenService);

  router.get(
    '/',
    auth,
    requirePermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ query: queueQuerySchema }),
    controller.list,
  );

  router.post(
    '/:entityType/:entityId/restore',
    auth,
    requirePermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ params: deletedItemParamsSchema }),
    controller.restore,
  );

  router.delete(
    '/:entityType/:entityId',
    auth,
    requirePermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ params: deletedItemParamsSchema, body: permanentDeleteBodySchema }),
    controller.permanentDelete,
  );

  return router;
}