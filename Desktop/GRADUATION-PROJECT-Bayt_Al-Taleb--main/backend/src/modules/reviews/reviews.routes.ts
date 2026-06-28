/**
 * Reviews routes. Mounted at `/api/v1/files/:fileId/reviews`.
 * Moderators review uploaded files.
 *
 *   POST /    files:review   (approve | reject a PENDING file)
 *   GET  /    files:read     (review history / audit trail)
 */
import { Router, type RequestHandler } from 'express';
import { requirePermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { PERMISSIONS } from '../../shared/rbac/permissions.js';
import type { ReviewsController } from './reviews.controller.js';
import { createReviewSchema, fileReviewParamsSchema } from './reviews.validation.js';

export function createReviewsRouter(
  controller: ReviewsController,
  authenticate: RequestHandler,
): Router {
  // mergeParams: true is MANDATORY — makes :fileId from the parent route
  // (/files/:fileId/reviews) visible in req.params inside this nested router.
  const router = Router({ mergeParams: true });

  // POST / — submit an APPROVE or REJECT decision on a PENDING file.
  router.post(
    '/',
    authenticate,
    requirePermission(PERMISSIONS.FILES_REVIEW),
    validate({ params: fileReviewParamsSchema, body: createReviewSchema }),
    controller.submit,
  );

  // GET / — read the review history (audit trail) for a file.
  router.get(
    '/',
    authenticate,
    requirePermission(PERMISSIONS.FILES_READ),
    validate({ params: fileReviewParamsSchema }),
    controller.list,
  );

  return router;
}
