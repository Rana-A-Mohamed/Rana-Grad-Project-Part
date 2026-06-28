import { Router } from 'express';
import type { RolesController } from './roles.controller.js';
import type { TokenService } from '../auth/auth.types.js';
import { authenticate } from '../../infrastructure/http/middlewares/auth.middleware.js';
import { requirePermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { PERMISSIONS } from '../../shared/rbac/permissions.js';
import { assignRoleParamsSchema, assignRoleBodySchema } from './roles.validation.js';

/**
 * Roles routes — mounted at /api/v1/roles
 *
 *   GET /              list all roles       (roles:read)
 *   PUT /:userId/assign  assign role to user  (roles:assign)
 */
export function createRolesRouter(
  controller: RolesController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const auth = authenticate(tokenService);

  router.get(
    '/',
    auth,
    requirePermission(PERMISSIONS.ROLES_READ),
    controller.list,
  );

  router.put(
    '/:userId/assign',
    auth,
    requirePermission(PERMISSIONS.ROLES_ASSIGN),
    validate({ params: assignRoleParamsSchema, body: assignRoleBodySchema }),
    controller.assign,
  );

  return router;
}