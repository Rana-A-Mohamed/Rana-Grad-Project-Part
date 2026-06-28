import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileOwnerType, FileStatus, FileType } from '@prisma/client';
import { FilesService } from '../../src/modules/files/files.service.js';
import type { FilesRepository } from '../../src/modules/files/files.repository.js';
import type { FileOwnerExistenceChecker } from '../../src/modules/files/files.types.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../src/shared/errors/app-error.js';
import { makeFile } from '../fixtures/index.js';
import {
  ADMIN_ACTOR,
  MEMBER_ACTOR,
  MODERATOR_ACTOR,
  makeAuthz,
  makeAudit,
  makeStorage,
} from '../mocks/fakes.js';

/**
 * FilesService unit tests — upload (to a valid major / scholarship, reject
 * invalid owner), approve/reject status transitions, and list-by-owner reads.
 * Owner existence checkers are registered as mocks, mirroring the DI wiring.
 */
describe('FilesService', () => {
  let repo: FilesRepository;
  let service: FilesService;
  let majorChecker: FileOwnerExistenceChecker;
  let scholarshipChecker: FileOwnerExistenceChecker;

  const uploadData = (over = {}) => ({
    title: 'Anatomy Summary',
    type: FileType.SUMMARY,
    storageKey: 'uploads/x.pdf',
    ownerType: FileOwnerType.MAJOR,
    ownerId: 'maj_1',
    ...over,
  });

  beforeEach(() => {
    repo = {
      findById: vi.fn(),
      list: vi.fn(),
      listByOwner: vi.fn(),
      findApprovedByOwner: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      softDelete: vi.fn().mockResolvedValue(true),
    } as unknown as FilesRepository;

    majorChecker = { exists: vi.fn().mockResolvedValue(true) };
    scholarshipChecker = { exists: vi.fn().mockResolvedValue(true) };

    // Moderator assigned to maj_1 + sch_1; member/admin not ownership-restricted.
    const authz = makeAuthz({ majors: new Set(['maj_1']), scholarships: new Set(['sch_1']) });
    service = new FilesService(repo, authz, makeAudit().audit, makeStorage().storage);
    service.registerOwnerChecker(FileOwnerType.MAJOR, majorChecker);
    service.registerOwnerChecker(FileOwnerType.SCHOLARSHIP, scholarshipChecker);
  });

  describe('upload', () => {
    it('uploads a file to a valid major (PENDING, owner persisted)', async () => {
      vi.mocked(repo.create).mockResolvedValue(makeFile());
      const result = await service.upload(MEMBER_ACTOR, 'usr_1', uploadData());

      expect(majorChecker.exists).toHaveBeenCalledWith(FileOwnerType.MAJOR, 'maj_1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: FileStatus.PENDING,
          uploadedById: 'usr_1',
          ownerType: FileOwnerType.MAJOR,
          ownerId: 'maj_1',
        }),
      );
      expect(result.status).toBe(FileStatus.PENDING);
      expect(result.ownerType).toBe(FileOwnerType.MAJOR);
    });

    it('uploads a file to a valid scholarship', async () => {
      vi.mocked(repo.create).mockResolvedValue(
        makeFile({ ownerType: FileOwnerType.SCHOLARSHIP, ownerId: 'sch_1' }),
      );
      const result = await service.upload(
        MEMBER_ACTOR,
        'usr_1',
        uploadData({ ownerType: FileOwnerType.SCHOLARSHIP, ownerId: 'sch_1' }),
      );
      expect(scholarshipChecker.exists).toHaveBeenCalledWith(FileOwnerType.SCHOLARSHIP, 'sch_1');
      expect(result.ownerType).toBe(FileOwnerType.SCHOLARSHIP);
    });

    it('rejects an upload when the owner does not exist (NotFoundError)', async () => {
      vi.mocked(majorChecker.exists).mockResolvedValue(false);
      await expect(
        service.upload(MEMBER_ACTOR, 'usr_1', uploadData({ ownerId: 'missing' })),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects an upload for an owner type with no registered checker', async () => {
      const bare = new FilesService(repo, makeAuthz(), makeAudit().audit, makeStorage().storage);
      await expect(bare.upload(MEMBER_ACTOR, 'usr_1', uploadData())).rejects.toBeInstanceOf(
        BadRequestError,
      );
    });

    it('lets a moderator upload to an assigned major', async () => {
      vi.mocked(repo.create).mockResolvedValue(makeFile());
      await service.upload(MODERATOR_ACTOR, 'mod_1', uploadData());
      expect(repo.create).toHaveBeenCalledOnce();
    });

    it('forbids a moderator uploading to an UNassigned major', async () => {
      await expect(
        service.upload(MODERATOR_ACTOR, 'mod_1', uploadData({ ownerId: 'maj_2' })),
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('admin can upload to any owner (bypass)', async () => {
      vi.mocked(repo.create).mockResolvedValue(makeFile());
      await service.upload(ADMIN_ACTOR, 'admin_1', uploadData({ ownerId: 'maj_999' }));
      expect(repo.create).toHaveBeenCalledOnce();
    });
  });

  describe('list by owner', () => {
    it('listByOwner returns all files for the owner', async () => {
      vi.mocked(repo.listByOwner).mockResolvedValue([makeFile(), makeFile({ id: 'file_2' })]);
      const items = await service.listByOwner(FileOwnerType.MAJOR, 'maj_1');
      expect(repo.listByOwner).toHaveBeenCalledWith(FileOwnerType.MAJOR, 'maj_1');
      expect(items).toHaveLength(2);
    });

    it('findApprovedByOwner returns only the approved set', async () => {
      vi.mocked(repo.findApprovedByOwner).mockResolvedValue([
        makeFile({ status: FileStatus.APPROVED }),
      ]);
      const items = await service.findApprovedByOwner(FileOwnerType.SCHOLARSHIP, 'sch_1');
      expect(repo.findApprovedByOwner).toHaveBeenCalledWith(FileOwnerType.SCHOLARSHIP, 'sch_1');
      expect(items[0]?.status).toBe(FileStatus.APPROVED);
    });
  });

  describe('status transitions', () => {
    it('approve: transitions status to APPROVED', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeFile());
      vi.mocked(repo.updateStatus).mockResolvedValue(makeFile({ status: FileStatus.APPROVED }));
      const result = await service.applyReviewStatus('file_1', FileStatus.APPROVED);
      expect(repo.updateStatus).toHaveBeenCalledWith('file_1', FileStatus.APPROVED);
      expect(result.status).toBe(FileStatus.APPROVED);
    });

    it('reject: transitions status to REJECTED', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeFile());
      vi.mocked(repo.updateStatus).mockResolvedValue(makeFile({ status: FileStatus.REJECTED }));
      const result = await service.applyReviewStatus('file_1', FileStatus.REJECTED);
      expect(result.status).toBe(FileStatus.REJECTED);
    });

    it('throws NotFoundError when transitioning a missing file', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(
        service.applyReviewStatus('missing', FileStatus.APPROVED),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('assertCanManageFile (used by reviews)', () => {
    it('allows a moderator assigned to the file owner', async () => {
      vi.mocked(repo.findById).mockResolvedValue(
        makeFile({ ownerType: FileOwnerType.MAJOR, ownerId: 'maj_1' }),
      );
      const file = await service.assertCanManageFile(MODERATOR_ACTOR, 'file_1');
      expect(file.ownerId).toBe('maj_1');
    });

    it('forbids a moderator NOT assigned to the file owner', async () => {
      vi.mocked(repo.findById).mockResolvedValue(
        makeFile({ ownerType: FileOwnerType.MAJOR, ownerId: 'maj_2' }),
      );
      await expect(service.assertCanManageFile(MODERATOR_ACTOR, 'file_1')).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
  });

  describe('soft delete', () => {
    it('soft-deletes a file (admin) via the repository', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeFile());
      await service.softDelete(ADMIN_ACTOR, 'file_1', 'spam');
      expect(repo.softDelete).toHaveBeenCalledWith('file_1', ADMIN_ACTOR.id, 'spam');
    });

    it('forbids a moderator soft-deleting a file of an unassigned owner', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeFile({ ownerId: 'maj_2' }));
      await expect(service.softDelete(MODERATOR_ACTOR, 'file_1', null)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('purges the binary from storage on soft delete', async () => {
      const { storage, store } = makeStorage();
      store.set('uploads/x.pdf', Buffer.from('data'));
      const svc = new FilesService(repo, makeAuthz(), makeAudit().audit, storage);
      vi.mocked(repo.findById).mockResolvedValue(makeFile({ storageKey: 'uploads/x.pdf' }));
      await svc.softDelete(ADMIN_ACTOR, 'file_1', null);
      expect(store.has('uploads/x.pdf')).toBe(false);
    });
  });

  describe('uploadFile (storage-backed)', () => {
    const binary = () => ({
      buffer: Buffer.from('%PDF-1.4 fake'),
      originalName: 'anatomy.pdf',
      mimeType: 'application/pdf',
    });
    const meta = (over = {}) => ({
      title: 'Anatomy',
      type: FileType.SUMMARY,
      ownerType: FileOwnerType.MAJOR,
      ownerId: 'maj_1',
      ...over,
    });

    it('writes to storage then persists a PENDING record', async () => {
      const { storage, store } = makeStorage();
      const svc = new FilesService(repo, makeAuthz({ majors: new Set(['maj_1']) }), makeAudit().audit, storage);
      svc.registerOwnerChecker(FileOwnerType.MAJOR, majorChecker);
      vi.mocked(repo.create).mockResolvedValue(makeFile());

      await svc.uploadFile(MEMBER_ACTOR, 'usr_1', meta(), binary());

      expect(store.size).toBe(1); // bytes landed
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: FileStatus.PENDING, mimeType: 'application/pdf' }),
      );
    });

    it('does NOT touch storage when the owner does not exist', async () => {
      const { storage, store } = makeStorage();
      vi.mocked(majorChecker.exists).mockResolvedValue(false);
      const svc = new FilesService(repo, makeAuthz(), makeAudit().audit, storage);
      svc.registerOwnerChecker(FileOwnerType.MAJOR, majorChecker);
      await expect(svc.uploadFile(MEMBER_ACTOR, 'usr_1', meta(), binary())).rejects.toBeInstanceOf(
        NotFoundError,
      );
      expect(store.size).toBe(0);
    });

    it('rolls back the stored object if the DB write fails', async () => {
      const { storage, store } = makeStorage();
      const svc = new FilesService(repo, makeAuthz(), makeAudit().audit, storage);
      svc.registerOwnerChecker(FileOwnerType.MAJOR, majorChecker);
      vi.mocked(repo.create).mockRejectedValue(new Error('db down'));
      await expect(svc.uploadFile(MEMBER_ACTOR, 'usr_1', meta(), binary())).rejects.toThrow('db down');
      expect(store.size).toBe(0); // orphan cleaned up
    });

    it('rejects an unsafe filename (double extension) before storing', async () => {
      const { storage, store } = makeStorage();
      const svc = new FilesService(repo, makeAuthz(), makeAudit().audit, storage);
      svc.registerOwnerChecker(FileOwnerType.MAJOR, majorChecker);
      await expect(
        svc.uploadFile(MEMBER_ACTOR, 'usr_1', meta(), { ...binary(), originalName: 'evil.pdf.exe' }),
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(store.size).toBe(0);
    });
  });

  describe('prepareDownload (permissions)', () => {
    const buildSvc = () => {
      const { storage, store } = makeStorage();
      store.set('uploads/f.pdf', Buffer.from('bytes'));
      const svc = new FilesService(repo, makeAuthz({ majors: new Set(['maj_1']) }), makeAudit().audit, storage);
      return { svc };
    };

    it('serves an APPROVED file to anyone (anonymous)', async () => {
      const { svc } = buildSvc();
      vi.mocked(repo.findById).mockResolvedValue(
        makeFile({ status: FileStatus.APPROVED, storageKey: 'uploads/f.pdf' }),
      );
      const dl = await svc.prepareDownload(undefined, 'file_1');
      expect(dl.buffer.toString()).toBe('bytes');
      expect(dl.fileName).toMatch(/\.pdf$/);
    });

    it('forbids anonymous access to a PENDING file', async () => {
      const { svc } = buildSvc();
      vi.mocked(repo.findById).mockResolvedValue(
        makeFile({ status: FileStatus.PENDING, storageKey: 'uploads/f.pdf' }),
      );
      await expect(svc.prepareDownload(undefined, 'file_1')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('lets the uploader download their own PENDING file', async () => {
      const { svc } = buildSvc();
      vi.mocked(repo.findById).mockResolvedValue(
        makeFile({ status: FileStatus.PENDING, uploadedById: MEMBER_ACTOR.id, storageKey: 'uploads/f.pdf' }),
      );
      const dl = await svc.prepareDownload(MEMBER_ACTOR, 'file_1');
      expect(dl.buffer.toString()).toBe('bytes');
    });

    it('lets an admin download any PENDING file', async () => {
      const { svc } = buildSvc();
      vi.mocked(repo.findById).mockResolvedValue(
        makeFile({ status: FileStatus.PENDING, storageKey: 'uploads/f.pdf' }),
      );
      await expect(svc.prepareDownload(ADMIN_ACTOR, 'file_1')).resolves.toBeDefined();
    });

    it('forbids a non-assigned moderator from a PENDING file', async () => {
      const { svc } = buildSvc();
      vi.mocked(repo.findById).mockResolvedValue(
        makeFile({ status: FileStatus.PENDING, ownerId: 'maj_2', storageKey: 'uploads/f.pdf' }),
      );
      await expect(svc.prepareDownload(MODERATOR_ACTOR, 'file_1')).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it('404s for a missing file', async () => {
      const { svc } = buildSvc();
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(svc.prepareDownload(ADMIN_ACTOR, 'missing')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
