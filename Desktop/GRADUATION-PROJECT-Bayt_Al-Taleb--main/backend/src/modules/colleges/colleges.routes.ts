import { Router, type RequestHandler } from 'express';
import { requirePermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { PERMISSIONS } from '../../shared/rbac/permissions.js';
import type { CollegesController } from './colleges.controller.js';
import { collegeIdParamsSchema, createCollegeSchema, listCollegesQuerySchema, updateCollegeSchema } from './colleges.validation.js';

export function createCollegesRouter(
  controller: CollegesController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/',
    validate({ query: listCollegesQuerySchema }),
    controller.list,
  );

  router.get(
    '/:id',
    validate({ params: collegeIdParamsSchema }),
    controller.getById,
  );

  router.get(
    '/:id/majors',
    validate({ params: collegeIdParamsSchema, query: listCollegesQuerySchema }),
    controller.listMajors,
  );

  router.post(
    '/',
    authenticate,
    requirePermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ body: createCollegeSchema }),
    controller.create,
  );

  router.patch(
    '/:id',
    authenticate,
    requirePermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ params: collegeIdParamsSchema, body: updateCollegeSchema }),
    controller.update,
  );

  router.delete(
    '/:id',
    authenticate,
    requirePermission(PERMISSIONS.MAJORS_MANAGE),
    validate({ params: collegeIdParamsSchema }),
    controller.delete,
  );

  return router;
}
