import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { created, noContent, ok, paginated } from '../../shared/utils/http-response.js';
import { actorOf } from '../../shared/utils/actor.js';
import { param } from '../../shared/utils/params.js';
import type { StorageProvider } from '../../infrastructure/storage/storage.provider.js';
import type { FilesService } from './files.service.js';
import { toFileDto } from './files.dto.js';
import type { UploadFileMetaInput, ListFilesQuery } from './files.validation.js';
import type { FileListFilter } from './files.types.js';

/**
 * FilesController — thin HTTP adapter over FilesService.
 * Validates → calls service → shapes response.  No business logic here.
 */
export class FilesController {
  constructor(
    private readonly service: FilesService,
    private readonly storage: StorageProvider,
  ) {}

  /**
   * POST /files — multipart upload.
   * req.file is set by createUploadMiddleware; req.body has validated UploadFileMetaInput.
   */
  upload = asyncHandler(async (req: Request, res: Response) => {
    const actor = actorOf(req);
    const meta = req.body as UploadFileMetaInput;
    const file = req.file!;

    const view = await this.service.uploadFile(actor, actor.id, meta, {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
    const publicUrl = this.storage.getPublicUrl(view.storageKey);
    created(res, toFileDto(view, publicUrl));
  });

  /**
   * GET /files — paginated list with optional filters.
   */
  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListFilesQuery;

    const filter: FileListFilter = {
      ownerType: query.ownerType,
      ownerId: query.ownerId,
      status: query.status,
      type: query.type,
      uploadedById: query.uploadedById,
      page: query.page,
      pageSize: query.pageSize,
    };

    const result = await this.service.list(filter);

    paginated(res, {
      ...result,
      items: result.items.map((view) =>
        toFileDto(view, this.storage.getPublicUrl(view.storageKey)),
      ),
    });
  });

  /**
   * GET /files/:fileId — single file by ID.
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const fileId = param(req, 'fileId');
    const view = await this.service.getById(fileId);
    const publicUrl = this.storage.getPublicUrl(view.storageKey);
    ok(res, toFileDto(view, publicUrl));
  });

  /**
   * GET /files/:fileId/download — stream binary to client.
   */
  download = asyncHandler(async (req: Request, res: Response) => {
    const fileId = param(req, 'fileId');
    // Pass the actor so the service can apply access-control.
    let actor;
    try {
      actor = actorOf(req);
    } catch {
      actor = undefined;
    }
    const file = await this.service.prepareDownload(actor, fileId);

    res.setHeader('Content-Type', file.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(file.buffer);
  });

  /**
   * DELETE /files/:fileId — soft-delete a file.
   * Optional body: { reason?: string }.
   */
  remove = asyncHandler(async (req: Request, res: Response) => {
    const actor = actorOf(req);
    const fileId = param(req, 'fileId');
    const { reason } = req.body as { reason?: string };

    await this.service.softDelete(actor, fileId, reason);
    noContent(res);
  });
}
