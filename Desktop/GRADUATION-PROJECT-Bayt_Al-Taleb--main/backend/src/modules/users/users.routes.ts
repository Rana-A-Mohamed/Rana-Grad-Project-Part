import { Router } from 'express';
import type { UsersController } from './users.controller.js';
import type { TokenService } from '../auth/auth.types.js';
import { authenticate } from '../../infrastructure/http/middlewares/auth.middleware.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { requirePermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { PERMISSIONS } from '../../shared/rbac/permissions.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
  listUsersQuerySchema,
} from './users.validation.js';

/**
 * Users routes — mounted at /api/v1/users
 *
 *   GET    /         list users         (users:read)
 *   POST   /         create user        (users:manage)
 *   GET    /:id      get user by id     (users:read)
 *   PATCH  /:id      update user        (users:manage)
 *   DELETE /:id      delete user        (users:manage)
 */
export function createUsersRouter(
  controller: UsersController,
  tokenService: TokenService,
): Router {
  const router = Router();
  const auth = authenticate(tokenService);

  router.get(
    '/',
    auth,
    requirePermission(PERMISSIONS.USERS_READ),
    validate({ query: listUsersQuerySchema }),
    controller.list,
  );

  router.post(
    '/',
    auth,
    requirePermission(PERMISSIONS.USERS_MANAGE),
    validate({ body: createUserSchema }),
    controller.create,
  );

  router.get(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.USERS_READ),
    validate({ params: userIdParamsSchema }),
    controller.getById,
  );

  router.patch(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.USERS_MANAGE),
    validate({ params: userIdParamsSchema, body: updateUserSchema }),
    controller.update,
  );

  router.delete(
    '/:id',
    auth,
    requirePermission(PERMISSIONS.USERS_MANAGE),
    validate({ params: userIdParamsSchema }),
    controller.delete,
  );

  return router;
}