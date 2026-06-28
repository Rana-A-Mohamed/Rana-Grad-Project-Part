import { Router, type RequestHandler } from 'express';
import { requirePermission, requireAnyPermission } from '../../infrastructure/http/middlewares/role.guard.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import { deleteReasonBodySchema } from '../../shared/soft-delete/delete-reason.schema.js';
import type { FilesController } from './files.controller.js';
import {
  uploadFileMetaSchema,
  fileIdParamsSchema,
  listFilesQuerySchema,
} from './files.validation.js';

/**
 * Build the Express router for the /files resource.
 *
 * @param controller      The FilesController instance.
 * @param authenticate    The `authenticate(tokenService)` RequestHandler from the DI container.
 * @param uploadMiddleware  Pre-built `createUploadMiddleware(maxMb)` for multipart handling.
 */
export function createFilesRouter(
  controller: FilesController,
  authenticate: RequestHandler,
  uploadMiddleware: RequestHandler,
): Router {
  const router = Router();

  // POST / — multipart upload
  // uploadMiddleware MUST run before validate so body fields are parsed from multipart.
  router.post(
    '/',
    authenticate,
    requirePermission('files:upload'),
    uploadMiddleware,
    validate({ body: uploadFileMetaSchema }),
    controller.upload.bind(controller),
  );

  // GET / — paginated list
  router.get(
    '/',
    authenticate,
    requirePermission('files:read'),
    validate({ query: listFilesQuerySchema }),
    controller.list.bind(controller),
  );

  // GET /:fileId/download — BEFORE /:fileId so Express matches the literal first
  router.get(
    '/:fileId/download',
    authenticate,
    requirePermission('files:read'),
    validate({ params: fileIdParamsSchema }),
    controller.download.bind(controller),
  );

  // GET /:fileId — single file
  router.get(
    '/:fileId',
    authenticate,
    requirePermission('files:read'),
    validate({ params: fileIdParamsSchema }),
    controller.getById.bind(controller),
  );

  // DELETE /:fileId — soft delete
  router.delete(
    '/:fileId',
    authenticate,
    requireAnyPermission('files:manage'),
    validate({ params: fileIdParamsSchema, body: deleteReasonBodySchema }),
    controller.remove.bind(controller),
  );

  return router;
}
