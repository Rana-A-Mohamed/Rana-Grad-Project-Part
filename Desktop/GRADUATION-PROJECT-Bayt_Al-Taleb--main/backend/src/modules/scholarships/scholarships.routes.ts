import { Router } from 'express';
import type { ScholarshipsController } from './scholarships.controller.js';
import type { TokenService } from '../auth/auth.types.js';
import { authenticate } from '../../infrastructure/http/middlewares/auth.middleware.js';
import { requirePermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { PERMISSIONS } from '../../shared/rbac/permissions.js';
import { createScholarshipSchema, updateScholarshipSchema, scholarshipIdParamsSchema, listScholarshipsQuerySchema } from './scholarships.validation.js';

export function createScholarshipsRouter(controller: ScholarshipsController, tokenService: TokenService): Router {
  const router = Router();
  const auth   = authenticate(tokenService);

  // Public
  router.get('/',    validate({ query: listScholarshipsQuerySchema }),                                                    controller.list);
  router.get('/:id', validate({ params: scholarshipIdParamsSchema }),                                                     controller.getById);

  // Protected
  router.post('/',     auth, requirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE), validate({ body: createScholarshipSchema }),                                         controller.create);
  router.patch('/:id', auth, requirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE), validate({ params: scholarshipIdParamsSchema, body: updateScholarshipSchema }),      controller.update);
  router.delete('/:id', auth, requirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE), validate({ params: scholarshipIdParamsSchema }),                                    controller.delete);

  return router;
}