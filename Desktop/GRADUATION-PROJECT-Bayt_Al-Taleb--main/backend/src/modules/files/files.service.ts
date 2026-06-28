/**
 * FilesService — authority over file upload, retrieval, status transitions,
 * access control, and soft-deletion.
 *
 * Constructor accepts a fully-built FilesRepository, AuthorizationService,
 * AuditService, and StorageProvider so this class is mockable in unit tests.
 */
import { AuditAction, AuditEntityType, FileOwnerType, FileStatus, RoleName } from '@prisma/client';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/app-error.js';
import type { Paginated } from '../../shared/types/index.js';
import type { Actor } from '../authorization/authorization.types.js';
import type { AuthorizationService } from '../authorization/authorization.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { StorageProvider } from '../../infrastructure/storage/storage.provider.js';
import { safeExtension } from '../../infrastructure/storage/upload-constraints.js';
import type { FilesRepository } from './files.repository.js';
import type {
  FileView,
  FileListFilter,
  UploadFileData,
  UploadFileMeta,
  UploadedBinary,
  FileDownload,
  FileOwnerExistenceChecker,
} from './files.types.js';

export class FilesService {
  /** Registry of per-ownerType existence checkers. */
  private readonly ownerCheckers = new Map<FileOwnerType, FileOwnerExistenceChecker>();

  constructor(
    private readonly repo: FilesRepository,
    private readonly authz: AuthorizationService,
    private readonly audit: AuditService,
    private readonly storage: StorageProvider,
  ) {}

  // ── Owner checker registration ─────────────────────────────────────────────

  /** Register an existence checker for a specific ownerType. */
  registerOwnerChecker(ownerType: FileOwnerType, checker: FileOwnerExistenceChecker): void {
    this.ownerCheckers.set(ownerType, checker);
  }

  // ── Core authorization helper ──────────────────────────────────────────────

  /**
   * Fetch the file (by repository, not raw db) and assert the actor may manage it.
   * Throws NotFoundError if the file does not exist or is soft-deleted.
   * Throws ForbiddenError if the actor's role/assignment denies access.
   * Returns the file view so callers avoid a second round-trip.
   */
  async assertCanManageFile(actor: Actor, fileId: string): Promise<FileView> {
    const file = await this.repo.findById(fileId);

    if (!file) {
      throw new NotFoundError(`File ${fileId} not found`);
    }

    // Delegate ownership check to the shared authorization service.
    await this.authz.assertCanManageFileOwner(actor, file.ownerType, file.ownerId);

    return file;
  }

  // ── Status transitions ─────────────────────────────────────────────────────

  /**
   * Transition a file's status (PENDING → APPROVED | REJECTED).
   * Called by ReviewsService after a review decision is persisted.
   * Returns the updated FileView.
   */
  async applyReviewStatus(fileId: string, status: FileStatus): Promise<FileView> {
    const file = await this.repo.findById(fileId);
    if (!file) {
      throw new NotFoundError(`File ${fileId} not found`);
    }
    return this.repo.updateStatus(fileId, status);
  }

  // ── Upload (metadata-only, storageKey provided externally) ────────────────

  /**
   * Persist a file record where the binary was already stored externally
   * (storageKey is in the uploadData). Validates owner existence,
   * checks upload authorization, then creates the DB record.
   *
   * @param actor       The authenticated actor performing the upload.
   * @param uploadedById  The user ID to record as the uploader.
   * @param data        Metadata + storageKey of the already-stored binary.
   */
  async upload(actor: Actor, uploadedById: string, data: UploadFileData): Promise<FileView> {
    // Verify the owner entity exists via registered checker.
    const checker = this.ownerCheckers.get(data.ownerType);
    if (!checker) {
      throw new BadRequestError(`No checker registered for owner type ${data.ownerType}`);
    }
    const ownerExists = await checker.exists(data.ownerType, data.ownerId);
    if (!ownerExists) {
      throw new NotFoundError(`${data.ownerType} ${data.ownerId} not found`);
    }

    // For moderators, assert they can manage the file's owner.
    if (actor.role === RoleName.MODERATOR) {
      await this.authz.assertCanManageFileOwner(actor, data.ownerType, data.ownerId);
    }

    const file = await this.repo.create({
      ...data,
      uploadedById,
      status: FileStatus.PENDING,
    });

    await this.audit.log({
      userId: actor.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.FILE,
      entityId: file.id,
    });

    return file;
  }

  // ── Upload (storage-backed, with binary) ──────────────────────────────────

  /**
   * Full upload flow with binary storage:
   * 1. Validate filename (reject unsafe extensions / double-extension attacks).
   * 2. Assert owner exists via registered checker.
   * 3. For MODERATOR actors, assert assignment to the owner entity.
   * 4. Upload binary to StorageProvider; roll back if DB write fails.
   * 5. Persist the File record.
   * 6. Log audit event.
   */
  async uploadFile(
    actor: Actor,
    uploadedById: string,
    meta: UploadFileMeta,
    binary: UploadedBinary,
  ): Promise<FileView> {
    // 1. Validate filename — reject unsafe filenames.
    const ext = safeExtension(binary.originalName);
    if (!ext) {
      throw new BadRequestError('Unsupported file type, double extension, or unsafe filename');
    }

    // 2. Assert owner entity exists.
    const checker = this.ownerCheckers.get(meta.ownerType);
    if (!checker) {
      throw new BadRequestError(`No checker registered for owner type ${meta.ownerType}`);
    }
    const ownerExists = await checker.exists(meta.ownerType, meta.ownerId);
    if (!ownerExists) {
      throw new NotFoundError(`${meta.ownerType} ${meta.ownerId} not found`);
    }

    // 3. For MODERATOR actors, assert assignment to the owner entity.
    if (actor.role === RoleName.MODERATOR) {
      await this.authz.assertCanManageFileOwner(actor, meta.ownerType, meta.ownerId);
    }

    // 4. Upload binary to storage.
    const keyPrefix = `${meta.ownerType.toLowerCase()}/${meta.ownerId}`;
    const stored = await this.storage.upload(
      {
        buffer: binary.buffer,
        originalName: binary.originalName,
        mimeType: binary.mimeType,
      },
      keyPrefix,
    );

    // 5. Persist the file record; roll back storage if DB fails.
    let file: FileView;
    try {
      file = await this.repo.create({
        title: meta.title,
        description: meta.description ?? null,
        type: meta.type,
        ownerType: meta.ownerType,
        ownerId: meta.ownerId,
        uploadedById,
        storageKey: stored.storageKey,
        mimeType: binary.mimeType,
        sizeBytes: stored.sizeBytes,
        status: FileStatus.PENDING,
      });
    } catch (err) {
      // Roll back the orphaned binary.
      await this.storage.delete(stored.storageKey).catch(() => undefined);
      throw err;
    }

    // 6. Log audit event.
    await this.audit.log({
      userId: actor.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.FILE,
      entityId: file.id,
    });

    return file;
  }

  // ── Read operations ────────────────────────────────────────────────────────

  /**
   * Returns the full FileView for a non-deleted file.
   * No permission check — READ is enforced by the route guard.
   */
  async getById(id: string): Promise<FileView> {
    const file = await this.repo.findById(id);
    if (!file) {
      throw new NotFoundError(`File ${id} not found`);
    }
    return file;
  }

  /**
   * Paginated list of non-deleted files with optional filters.
   */
  async list(filter: FileListFilter): Promise<Paginated<FileView>> {
    return this.repo.findMany(filter);
  }

  /**
   * All non-deleted files for a specific owner.
   */
  async listByOwner(ownerType: FileOwnerType, ownerId: string): Promise<FileView[]> {
    return this.repo.listByOwner(ownerType, ownerId);
  }

  /**
   * Approved non-deleted files for a specific owner.
   */
  async findApprovedByOwner(ownerType: FileOwnerType, ownerId: string): Promise<FileView[]> {
    return this.repo.findApprovedByOwner(ownerType, ownerId);
  }

  // ── Download ───────────────────────────────────────────────────────────────

  /**
   * Permission-gated binary download:
   * - APPROVED files: accessible to any caller (including anonymous).
   * - PENDING/REJECTED files: only the uploader, or ADMIN/SUPER_ADMIN, or an
   *   assigned MODERATOR may download.
   * Throws NotFoundError if the file or binary is absent.
   * Throws ForbiddenError if the actor lacks access.
   */
  async prepareDownload(actor: Actor | undefined, id: string): Promise<FileDownload> {
    const file = await this.repo.findById(id);
    if (!file) {
      throw new NotFoundError(`File ${id} not found`);
    }

    // Access control for non-approved files.
    if (file.status !== FileStatus.APPROVED) {
      // Uploader can always download their own file.
      const isUploader = actor && actor.id === file.uploadedById;
      // Admin / super-admin bypass.
      const isAdmin =
        actor &&
        (actor.role === RoleName.ADMIN || actor.role === RoleName.SUPER_ADMIN);

      if (!isUploader && !isAdmin) {
        // Check if MODERATOR is assigned to this file's owner.
        if (actor && actor.role === RoleName.MODERATOR) {
          try {
            await this.authz.assertCanManageFileOwner(actor, file.ownerType, file.ownerId);
          } catch {
            throw new ForbiddenError('You do not have permission to download this file');
          }
        } else {
          throw new ForbiddenError('You do not have permission to download this file');
        }
      }
    }

    const exists = await this.storage.exists(file.storageKey);
    if (!exists) {
      throw new NotFoundError(`Binary for file ${id} not found in storage`);
    }

    const buffer = await this.storage.read(file.storageKey);

    // Derive a safe filename from the title + storage key extension.
    const ext = file.storageKey.split('.').pop();
    const safeTitle = file.title.replace(/[^a-z0-9_\-. ]/gi, '_');
    const fileName = ext ? `${safeTitle}.${ext}` : safeTitle;

    return {
      buffer,
      mimeType: file.mimeType ?? 'application/octet-stream',
      fileName,
      filename: fileName, // alias for controllers using `filename`
    };
  }

  /**
   * Alias for prepareDownload — used by the HTTP controller.
   */
  async getDownload(id: string, actor?: Actor): Promise<FileDownload> {
    return this.prepareDownload(actor, id);
  }

  // ── Soft delete ────────────────────────────────────────────────────────────

  /**
   * Soft-deletes a file. Actor must be authorised (assertCanManageFile).
   * Purges the binary from storage. Logs audit DELETE.
   */
  async softDelete(actor: Actor, id: string, reason: string | null | undefined): Promise<void> {
    // assertCanManageFile also verifies the file exists.
    const file = await this.assertCanManageFile(actor, id);

    await this.repo.softDelete(id, actor.id, reason ?? null);

    // Purge binary from storage.
    await this.storage.delete(file.storageKey).catch(() => undefined);

    await this.audit.log({
      userId: actor.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.FILE,
      entityId: id,
      reason: reason ?? undefined,
      metadata: { reason },
    });
  }
}
