import { Router, type RequestHandler } from 'express';
import { requireAnyPermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { PERMISSIONS } from '../../shared/rbac/permissions.js';
import type { ContactController } from './contact.controller.js';
import {
  contactIdParamsSchema,
  listContactQuerySchema,
  submitContactSchema,
} from './contact.validation.js';

export function createContactRouter(
  controller: ContactController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  // POST / — public; no authentication required.
  router.post(
    '/',
    validate({ body: submitContactSchema }),
    controller.submit,
  );

  // GET / — requires CONTACT_MANAGE permission (ADMIN+).
  router.get(
    '/',
    authenticate,
    requireAnyPermission(PERMISSIONS.CONTACT_MANAGE),
    validate({ query: listContactQuerySchema }),
    controller.list,
  );

  // GET /:id — requires CONTACT_MANAGE permission (ADMIN+).
  router.get(
    '/:id',
    authenticate,
    requireAnyPermission(PERMISSIONS.CONTACT_MANAGE),
    validate({ params: contactIdParamsSchema }),
    controller.getById,
  );

  // DELETE /:id — requires CONTACT_MANAGE permission (ADMIN+).
  router.delete(
    '/:id',
    authenticate,
    requireAnyPermission(PERMISSIONS.CONTACT_MANAGE),
    validate({ params: contactIdParamsSchema }),
    controller.delete,
  );

  return router;
}
