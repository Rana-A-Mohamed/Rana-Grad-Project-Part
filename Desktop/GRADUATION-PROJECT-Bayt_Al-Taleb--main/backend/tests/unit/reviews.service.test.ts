import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileStatus, ReviewAction } from '@prisma/client';
import { ReviewsService } from '../../src/modules/reviews/reviews.service.js';
import type { ReviewsRepository } from '../../src/modules/reviews/reviews.repository.js';
import type { FilesService } from '../../src/modules/files/files.service.js';
import { ConflictError, ForbiddenError } from '../../src/shared/errors/app-error.js';
import { makeFile, makeReview } from '../fixtures/index.js';
import type { FileView } from '../../src/modules/files/files.types.js';
import { MODERATOR_ACTOR, makeAudit, makeNotifications } from '../mocks/fakes.js';

/**
 * ReviewsService unit tests — review creation + review history, including the
 * moderator ownership gate (a moderator may only review files whose owner is
 * assigned to them). FilesService.assertCanManageFile is the injected gate.
 */
describe('ReviewsService', () => {
  let repo: ReviewsRepository;
  let files: FilesService;
  let service: ReviewsService;

  const fileView = (status: FileStatus = FileStatus.PENDING): FileView => ({
    ...makeFile({ status }),
    description: null,
    mimeType: null,
    sizeBytes: null,
  });

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      listForFile: vi.fn(),
    } as unknown as ReviewsRepository;
    files = {
      // resolves the file AND authorizes — happy path returns the file.
      assertCanManageFile: vi.fn(),
      applyReviewStatus: vi.fn(),
    } as unknown as FilesService;
    service = new ReviewsService(repo, files, makeAudit().audit, makeNotifications().notifications);
  });

  describe('review creation', () => {
    it('approves a PENDING file: persists review + sets APPROVED', async () => {
      vi.mocked(files.assertCanManageFile).mockResolvedValue(fileView(FileStatus.PENDING));
      vi.mocked(repo.create).mockResolvedValue(makeReview({ action: ReviewAction.APPROVE }));

      const result = await service.review(MODERATOR_ACTOR, 'file_1', {
        action: ReviewAction.APPROVE,
      });

      expect(files.assertCanManageFile).toHaveBeenCalledWith(MODERATOR_ACTOR, 'file_1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ fileId: 'file_1', reviewerId: MODERATOR_ACTOR.id }),
      );
      expect(files.applyReviewStatus).toHaveBeenCalledWith('file_1', FileStatus.APPROVED);
      expect(result.action).toBe(ReviewAction.APPROVE);
    });

    it('rejects a PENDING file: sets REJECTED', async () => {
      vi.mocked(files.assertCanManageFile).mockResolvedValue(fileView(FileStatus.PENDING));
      vi.mocked(repo.create).mockResolvedValue(makeReview({ action: ReviewAction.REJECT }));

      await service.review(MODERATOR_ACTOR, 'file_1', { action: ReviewAction.REJECT });
      expect(files.applyReviewStatus).toHaveBeenCalledWith('file_1', FileStatus.REJECTED);
    });

    it('refuses to re-review a non-PENDING file (ConflictError)', async () => {
      vi.mocked(files.assertCanManageFile).mockResolvedValue(fileView(FileStatus.APPROVED));
      await expect(
        service.review(MODERATOR_ACTOR, 'file_1', { action: ReviewAction.REJECT }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('forbids reviewing a file the moderator is not assigned to', async () => {
      vi.mocked(files.assertCanManageFile).mockRejectedValue(new ForbiddenError());
      await expect(
        service.review(MODERATOR_ACTOR, 'file_1', { action: ReviewAction.APPROVE }),
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('review history', () => {
    it('returns the audit trail newest-first for a file', async () => {
      vi.mocked(files.assertCanManageFile).mockResolvedValue(fileView());
      vi.mocked(repo.listForFile).mockResolvedValue([
        makeReview({ id: 'rev_2', action: ReviewAction.APPROVE }),
        makeReview({ id: 'rev_1', action: ReviewAction.REJECT }),
      ]);

      const history = await service.history(MODERATOR_ACTOR, 'file_1');
      expect(files.assertCanManageFile).toHaveBeenCalledWith(MODERATOR_ACTOR, 'file_1');
      expect(repo.listForFile).toHaveBeenCalledWith('file_1');
      expect(history).toHaveLength(2);
      expect(history[0]?.id).toBe('rev_2');
    });

    it('forbids history for a file the moderator is not assigned to', async () => {
      vi.mocked(files.assertCanManageFile).mockRejectedValue(new ForbiddenError());
      await expect(service.history(MODERATOR_ACTOR, 'file_1')).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
  });
});
