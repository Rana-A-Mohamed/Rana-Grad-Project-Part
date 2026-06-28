/**
 * ReviewsService — the single authority over the file approval workflow.
 *
 * Recording a review: (1) verifies the file exists & is still PENDING, then
 * (2) persists the review (immutable audit trail), then (3) transitions the
 * file's status via FilesService. FilesService is injected, so the workflow is
 * unit-testable end-to-end with mocks and no DB.
 */
import { AuditAction, AuditEntityType, FileStatus, ReviewAction } from '@prisma/client';
import { ConflictError } from '../../shared/errors/app-error.js';
import type { Actor } from '../authorization/authorization.types.js';
import type { AuditService } from '../audit/audit.service.js';
import type { ReviewsRepository } from './reviews.repository.js';
import type { ReviewView } from './reviews.types.js';
import type { CreateReviewInput } from './reviews.validation.js';

/**
 * Minimal interface over FilesService to avoid a circular import.
 * The DI container passes the real FilesService at runtime.
 *
 * `assertCanManageFile` resolves if the actor may review the file,
 * and throws ForbiddenError / NotFoundError otherwise.
 * `applyReviewStatus` transitions the file's status after a decision.
 */
interface FileStatusUpdater {
  assertCanManageFile(actor: Actor, fileId: string): Promise<{ status: FileStatus; uploadedById: string }>;
  applyReviewStatus(fileId: string, status: FileStatus): Promise<void>;
}

/**
 * Minimal interface over NotificationService to avoid a circular import.
 * The DI container passes the real NotificationService at runtime.
 */
interface ReviewNotifier {
  notifyUser(data: { userId: string; title: string; message: string; metadata?: unknown }): Promise<void>;
}

export class ReviewsService {
  constructor(
    private readonly repo: ReviewsRepository,
    private readonly files: FileStatusUpdater,
    private readonly audit: AuditService,
    private readonly notifications: ReviewNotifier,
  ) {}

  /**
   * Submit a review decision for a file.
   * Steps execute in strict order: authorize → check status → persist → transition → audit → notify.
   */
  async review(actor: Actor, fileId: string, input: CreateReviewInput): Promise<ReviewView> {
    // 1. Assert the actor can manage this file (throws ForbiddenError / NotFoundError if not).
    const file = await this.files.assertCanManageFile(actor, fileId);

    // 2. Only PENDING files can be reviewed.
    if (file.status !== FileStatus.PENDING) {
      throw new ConflictError('File has already been reviewed');
    }

    // 3. Persist the immutable review record.
    const review = await this.repo.create({
      fileId,
      reviewerId: actor.id,
      action: input.action,
      comment: input.comment ?? null,
    });

    // 4. Transition file status based on the review decision.
    const newStatus =
      input.action === ReviewAction.APPROVE ? FileStatus.APPROVED : FileStatus.REJECTED;
    await this.files.applyReviewStatus(fileId, newStatus);

    // 5. Append to the audit log (fire-and-forget — AuditService never throws).
    await this.audit.log({
      userId: actor.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.FILE,
      entityId: fileId,
      metadata: { action: input.action, reviewId: review.id },
    });

    // 6. Notify the file owner. Errors are swallowed — a notification failure
    //    must never surface as an HTTP error on the review request.
    const title =
      input.action === ReviewAction.APPROVE ? 'File approved' : 'File rejected';
    const message =
      input.action === ReviewAction.APPROVE
        ? 'Your file has been approved'
        : input.comment
          ? `Your file has been rejected: ${input.comment}`
          : 'Your file has been rejected';

    try {
      await this.notifications.notifyUser({ userId: file.uploadedById, title, message });
    } catch {
      /* non-critical — notification failure must not fail the review */
    }

    return review;
  }

  /**
   * Return the review history (audit trail) for a file, newest first.
   * The actor must be authorised to manage the file before reading its history.
   * An empty array is valid when no reviews exist yet.
   */
  async history(actor: Actor, fileId: string): Promise<ReviewView[]> {
    // Assert the actor can manage this file (throws ForbiddenError / NotFoundError if not).
    await this.files.assertCanManageFile(actor, fileId);
    return this.repo.listForFile(fileId);
  }
}