import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentEntityType, FileOwnerType } from '@prisma/client';
import { ScholarshipsService } from '../../src/modules/scholarships/scholarships.service.js';
import type { ScholarshipsRepository } from '../../src/modules/scholarships/scholarships.repository.js';
import { ForbiddenError, NotFoundError } from '../../src/shared/errors/app-error.js';
import { makeScholarship } from '../fixtures/index.js';
import { ADMIN_ACTOR, MODERATOR_ACTOR, makeAuthz, makeAudit } from '../mocks/fakes.js';

/** ScholarshipsService unit tests — create, update, existence checking. */
describe('ScholarshipsService', () => {
  let repo: ScholarshipsRepository;
  let service: ScholarshipsService;

  beforeEach(() => {
    repo = {
      exists: vi.fn(),
      findById: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn().mockResolvedValue(true),
    } as unknown as ScholarshipsRepository;
    // Moderator is assigned to sch_1 only.
    service = new ScholarshipsService(
      repo,
      makeAuthz({ scholarships: new Set(['sch_1']) }),
      makeAudit().audit,
    );
  });

  it('creates a scholarship', async () => {
    vi.mocked(repo.create).mockResolvedValue(makeScholarship());
    const result = await service.create(ADMIN_ACTOR, { slug: 'fulbright', name: 'Fulbright' });
    expect(result.slug).toBe('fulbright');
  });

  it('soft-deletes a scholarship', async () => {
    vi.mocked(repo.findById).mockResolvedValue(makeScholarship());
    await service.softDelete(ADMIN_ACTOR, 'sch_1', null);
    expect(repo.softDelete).toHaveBeenCalledWith('sch_1', ADMIN_ACTOR.id, null);
  });

  it('updates an existing scholarship (admin bypasses ownership)', async () => {
    vi.mocked(repo.findById).mockResolvedValue(makeScholarship());
    vi.mocked(repo.update).mockResolvedValue(makeScholarship({ name: 'Fulbright MENA' }));
    const result = await service.update(ADMIN_ACTOR, 'sch_1', { name: 'Fulbright MENA' });
    expect(result.name).toBe('Fulbright MENA');
  });

  it('lets a moderator update an assigned scholarship', async () => {
    vi.mocked(repo.findById).mockResolvedValue(makeScholarship());
    vi.mocked(repo.update).mockResolvedValue(makeScholarship({ name: 'Ministry' }));
    const result = await service.update(MODERATOR_ACTOR, 'sch_1', { name: 'Ministry' });
    expect(result.name).toBe('Ministry');
  });

  it('forbids a moderator from updating an UNassigned scholarship', async () => {
    vi.mocked(repo.findById).mockResolvedValue(makeScholarship({ id: 'sch_2' }));
    await expect(
      service.update(MODERATOR_ACTOR, 'sch_2', { name: 'X' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when updating a missing scholarship', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.update(ADMIN_ACTOR, 'missing', { name: 'x' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('reports existence only for SCHOLARSHIP entity type', async () => {
    vi.mocked(repo.exists).mockResolvedValue(true);
    expect(await service.exists(ContentEntityType.SCHOLARSHIP, 'sch_1')).toBe(true);
    expect(await service.exists(ContentEntityType.MAJOR, 'sch_1')).toBe(false);
  });

  it('acts as a file-owner checker only for SCHOLARSHIP owners', async () => {
    vi.mocked(repo.exists).mockResolvedValue(true);
    expect(await service.fileOwnerExists(FileOwnerType.SCHOLARSHIP, 'sch_1')).toBe(true);
    expect(await service.fileOwnerExists(FileOwnerType.MAJOR, 'sch_1')).toBe(false);
  });
});
