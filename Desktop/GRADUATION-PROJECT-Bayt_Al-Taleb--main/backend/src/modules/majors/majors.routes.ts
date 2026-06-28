import { Router, type RequestHandler } from 'express';
import { requireAnyPermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { PERMISSIONS } from '../../shared/rbac/permissions.js';
import type { MajorsController } from './majors.controller.js';
import {
  createMajorSchema,
  listMajorsQuerySchema,
  majorIdParamsSchema,
  majorSlugParamsSchema,
  updateMajorSchema,
  deleteMajorSchema,
} from './majors.validation.js';

export function createMajorsRouter(
  controller: MajorsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/',
    validate({ query: listMajorsQuerySchema }),
    controller.list.bind(controller),
  );

  router.get(
    '/slug/:slug',
    validate({ params: majorSlugParamsSchema }),
    controller.getBySlug.bind(controller),
  );

  router.get(
    '/:id',
    validate({ params: majorIdParamsSchema }),
    controller.getById.bind(controller),
  );

  router.post(
    '/',
    authenticate,
    requireAnyPermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ body: createMajorSchema }),
    controller.create.bind(controller),
  );

  router.patch(
    '/:id',
    authenticate,
    requireAnyPermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ params: majorIdParamsSchema, body: updateMajorSchema }),
    controller.update.bind(controller),
  );

  router.delete(
    '/:id',
    authenticate,
    requireAnyPermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ params: majorIdParamsSchema, body: deleteMajorSchema }),
    controller.delete.bind(controller),
  );

  return router;
}
