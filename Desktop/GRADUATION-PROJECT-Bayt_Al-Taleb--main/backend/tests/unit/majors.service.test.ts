// import { beforeEach, describe, expect, it, vi } from 'vitest';
// import { ContentEntityType, FileOwnerType } from '@prisma/client';
// import { MajorsService } from '../../src/modules/majors/majors.service.js';
// import type { MajorsRepository } from '../../src/modules/majors/majors.repository.js';
// import { ForbiddenError, NotFoundError } from '../../src/shared/errors/app-error.js';
// import { makeMajor } from '../fixtures/index.js';
// import { ADMIN_ACTOR, MODERATOR_ACTOR, makeAuthz, makeAudit } from '../mocks/fakes.js';

// /** MajorsService unit tests — create major, update major, existence checking. */
// describe('MajorsService', () => {
//   let repo: MajorsRepository;
//   let service: MajorsService;

//   let auditRepo: { create: ReturnType<typeof vi.fn> };

//   beforeEach(() => {
//     repo = {
//       exists: vi.fn(),
//       findById: vi.fn(),
//       list: vi.fn(),
//       create: vi.fn(),
//       update: vi.fn(),
//       softDelete: vi.fn().mockResolvedValue(true),
//       listByCollege: vi.fn(),
//     } as unknown as MajorsRepository;
//     const audit = makeAudit();
//     auditRepo = audit.auditRepo;
//     // Moderator is assigned to maj_1 only.
//     service = new MajorsService(repo, makeAuthz({ majors: new Set(['maj_1']) }), audit.audit);
//     // College checker: only 'col_1' exists.
//     service.registerCollegeChecker({ exists: async (id) => id === 'col_1' });
//   });

//   it('creates a major with isActive defaulting to true', async () => {
//     vi.mocked(repo.create).mockResolvedValue(makeMajor());
//     const result = await service.create(ADMIN_ACTOR, {
//       slug: 'computer-science',
//       name: 'Computer Science',
//     });
//     expect(repo.create).toHaveBeenCalledWith(
//       expect.objectContaining({ slug: 'computer-science', isActive: true }),
//     );
//     expect(result.slug).toBe('computer-science');
//   });

//   it('updates an existing major (admin bypasses ownership)', async () => {
//     vi.mocked(repo.findById).mockResolvedValue(makeMajor());
//     vi.mocked(repo.update).mockResolvedValue(makeMajor({ name: 'CS & Eng' }));
//     const result = await service.update(ADMIN_ACTOR, 'maj_1', { name: 'CS & Eng' });
//     expect(result.name).toBe('CS & Eng');
//   });

//   it('lets a moderator update an assigned major', async () => {
//     vi.mocked(repo.findById).mockResolvedValue(makeMajor());
//     vi.mocked(repo.update).mockResolvedValue(makeMajor({ name: 'Nursing' }));
//     const result = await service.update(MODERATOR_ACTOR, 'maj_1', { name: 'Nursing' });
//     expect(result.name).toBe('Nursing');
//   });

//   it('forbids a moderator from updating an UNassigned major', async () => {
//     vi.mocked(repo.findById).mockResolvedValue(makeMajor({ id: 'maj_2' }));
//     await expect(
//       service.update(MODERATOR_ACTOR, 'maj_2', { name: 'Computer Science' }),
//     ).rejects.toBeInstanceOf(ForbiddenError);
//     expect(repo.update).not.toHaveBeenCalled();
//   });

//   it('throws NotFoundError when updating a missing major', async () => {
//     vi.mocked(repo.findById).mockResolvedValue(null);
//     await expect(service.update(ADMIN_ACTOR, 'missing', { name: 'x' })).rejects.toBeInstanceOf(
//       NotFoundError,
//     );
//   });

//   it('reports existence only for MAJOR entity type', async () => {
//     vi.mocked(repo.exists).mockResolvedValue(true);
//     expect(await service.exists(ContentEntityType.MAJOR, 'maj_1')).toBe(true);
//     expect(await service.exists(ContentEntityType.SCHOLARSHIP, 'maj_1')).toBe(false);
//   });

//   it('acts as a file-owner checker only for MAJOR owners', async () => {
//     vi.mocked(repo.exists).mockResolvedValue(true);
//     expect(await service.fileOwnerExists(FileOwnerType.MAJOR, 'maj_1')).toBe(true);
//     expect(await service.fileOwnerExists(FileOwnerType.SCHOLARSHIP, 'maj_1')).toBe(false);
//   });

//   it('soft-deletes a major and writes a DELETE audit log', async () => {
//     vi.mocked(repo.findById).mockResolvedValue(makeMajor());
//     await service.softDelete(ADMIN_ACTOR, 'maj_1', 'duplicate');
//     expect(repo.softDelete).toHaveBeenCalledWith('maj_1', ADMIN_ACTOR.id, 'duplicate');
//     expect(auditRepo.create).toHaveBeenCalledWith(
//       expect.objectContaining({ action: 'DELETE', entityType: 'MAJOR', entityId: 'maj_1' }),
//     );
//   });

//   it('writes a CREATE audit log on create', async () => {
//     vi.mocked(repo.create).mockResolvedValue(makeMajor());
//     await service.create(ADMIN_ACTOR, { slug: 'nursing', name: 'Nursing' });
//     expect(auditRepo.create).toHaveBeenCalledWith(
//       expect.objectContaining({ action: 'CREATE', entityType: 'MAJOR' }),
//     );
//   });

//   it('creates a major under an existing college', async () => {
//     vi.mocked(repo.create).mockResolvedValue(makeMajor({ collegeId: 'col_1' }));
//     const result = await service.create(ADMIN_ACTOR, {
//       slug: 'civil',
//       name: 'Civil',
//       collegeId: 'col_1',
//     });
//     expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ collegeId: 'col_1' }));
//     expect(result.collegeId).toBe('col_1');
//   });

//   it('rejects creating a major under a non-existent college (NotFoundError)', async () => {
//     await expect(
//       service.create(ADMIN_ACTOR, { slug: 'civil', name: 'Civil', collegeId: 'col_missing' }),
//     ).rejects.toBeInstanceOf(NotFoundError);
//     expect(repo.create).not.toHaveBeenCalled();
//   });

//   it('lists majors by college', async () => {
//     vi.mocked(repo.listByCollege).mockResolvedValue({
//       items: [makeMajor({ collegeId: 'col_1' })],
//       total: 1,
//     });
//     const { items, total } = await service.listByCollege('col_1', 1, 20);
//     expect(repo.listByCollege).toHaveBeenCalledWith('col_1', { skip: 0, take: 20 });
//     expect(total).toBe(1);
//     expect(items[0]?.collegeId).toBe('col_1');
//   });
// });
