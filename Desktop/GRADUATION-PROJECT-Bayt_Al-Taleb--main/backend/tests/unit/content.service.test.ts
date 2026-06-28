import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentEntityType } from '@prisma/client';
import { ContentService } from '../../src/modules/content/content.service.js';
import type { ContentRepository } from '../../src/modules/content/content.repository.js';
import type { EntityExistenceChecker } from '../../src/modules/content/content.types.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../src/shared/errors/app-error.js';
import { makeSection } from '../fixtures/index.js';
import { ADMIN_ACTOR, MODERATOR_ACTOR, makeAuthz, makeAudit } from '../mocks/fakes.js';
import { makeFaq } from '../fixtures/index.js';

/**
 * ContentService unit tests — the polymorphic section/FAQ engine.
 * Covers "add section" for BOTH majors and scholarships through the SAME
 * service, plus ownership and existence-checker enforcement.
 */
describe('ContentService (polymorphic)', () => {
  let repo: ContentRepository;
  let service: ContentService;
  let majorChecker: EntityExistenceChecker;
  let scholarshipChecker: EntityExistenceChecker;

  beforeEach(() => {
    repo = {
      listSections: vi.fn(),
      findSection: vi.fn(),
      createSection: vi.fn(),
      updateSection: vi.fn(),
      deleteSection: vi.fn(),
      listFaqs: vi.fn(),
      findFaq: vi.fn(),
      createFaq: vi.fn(),
      updateFaq: vi.fn(),
      deleteFaq: vi.fn(),
    } as unknown as ContentRepository;

    majorChecker = { exists: vi.fn().mockResolvedValue(true) };
    scholarshipChecker = { exists: vi.fn().mockResolvedValue(true) };

    // Moderator assigned to maj_1 + sch_1; admin bypasses ownership entirely.
    const authz = makeAuthz({ majors: new Set(['maj_1']), scholarships: new Set(['sch_1']) });
    service = new ContentService(repo, authz, makeAudit().audit);
    service.registerChecker(ContentEntityType.MAJOR, majorChecker);
    service.registerChecker(ContentEntityType.SCHOLARSHIP, scholarshipChecker);
  });

  it('adds a section to a major (same generic system)', async () => {
    vi.mocked(repo.createSection).mockResolvedValue(makeSection());
    const result = await service.addSection(ADMIN_ACTOR, ContentEntityType.MAJOR, 'maj_1', {
      title: 'Overview',
      content: 'text',
    });
    expect(majorChecker.exists).toHaveBeenCalledWith(ContentEntityType.MAJOR, 'maj_1');
    expect(repo.createSection).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: ContentEntityType.MAJOR, entityId: 'maj_1' }),
    );
    expect(result.title).toBe('Overview');
  });

  it('adds a section to a scholarship via the same service', async () => {
    vi.mocked(repo.createSection).mockResolvedValue(
      makeSection({ entityType: 'SCHOLARSHIP', entityId: 'sch_1' }),
    );
    await service.addSection(ADMIN_ACTOR, ContentEntityType.SCHOLARSHIP, 'sch_1', {
      title: 'Eligibility',
      content: 'text',
    });
    expect(scholarshipChecker.exists).toHaveBeenCalledWith(ContentEntityType.SCHOLARSHIP, 'sch_1');
  });

  it('rejects adding a section to a non-existent owner with NotFoundError', async () => {
    vi.mocked(majorChecker.exists).mockResolvedValue(false);
    await expect(
      service.addSection(ADMIN_ACTOR, ContentEntityType.MAJOR, 'missing', {
        title: 't',
        content: 'c',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects an entity type with no registered checker', async () => {
    const bare = new ContentService(repo, makeAuthz(), makeAudit().audit);
    await expect(
      bare.addSection(ADMIN_ACTOR, ContentEntityType.MAJOR, 'maj_1', { title: 't', content: 'c' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('forbids a moderator from managing content of an UNassigned major', async () => {
    await expect(
      service.addSection(MODERATOR_ACTOR, ContentEntityType.MAJOR, 'maj_2', {
        title: 't',
        content: 'c',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.createSection).not.toHaveBeenCalled();
  });

  it('lets a moderator add a section to an assigned major', async () => {
    vi.mocked(repo.createSection).mockResolvedValue(makeSection());
    const result = await service.addSection(MODERATOR_ACTOR, ContentEntityType.MAJOR, 'maj_1', {
      title: 'Anatomy',
      content: 'text',
    });
    expect(result.title).toBeDefined();
  });

  it('enforces ownership on update (cross-entity edit is blocked)', async () => {
    vi.mocked(repo.findSection).mockResolvedValue(
      makeSection({ entityType: 'MAJOR', entityId: 'maj_1' }),
    );
    await expect(
      // same section id, but presented under a different owner
      service.updateSection(ADMIN_ACTOR, ContentEntityType.SCHOLARSHIP, 'sch_1', 'sec_1', {
        title: 'x',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lists sections for an existing owner', async () => {
    vi.mocked(repo.listSections).mockResolvedValue([makeSection()]);
    const result = await service.listSections(ContentEntityType.MAJOR, 'maj_1');
    expect(result).toHaveLength(1);
  });

  it('updates and removes an owned section (admin)', async () => {
    vi.mocked(repo.findSection).mockResolvedValue(makeSection());
    vi.mocked(repo.updateSection).mockResolvedValue(makeSection({ title: 'New' }));
    const updated = await service.updateSection(ADMIN_ACTOR, ContentEntityType.MAJOR, 'maj_1', 'sec_1', {
      title: 'New',
    });
    expect(updated.title).toBe('New');

    vi.mocked(repo.deleteSection).mockResolvedValue(true);
    await service.removeSection(ADMIN_ACTOR, ContentEntityType.MAJOR, 'maj_1', 'sec_1', 'cleanup');
    expect(repo.deleteSection).toHaveBeenCalledWith('sec_1', ADMIN_ACTOR.id, 'cleanup');
  });

  it('adds, lists, updates and removes FAQs via the same system', async () => {
    const faq = makeFaq();
    vi.mocked(repo.createFaq).mockResolvedValue(faq);
    vi.mocked(repo.listFaqs).mockResolvedValue([faq]);
    vi.mocked(repo.findFaq).mockResolvedValue(faq);
    vi.mocked(repo.updateFaq).mockResolvedValue(makeFaq({ answer: 'B' }));
    vi.mocked(repo.deleteFaq).mockResolvedValue(true);

    const added = await service.addFaq(ADMIN_ACTOR, ContentEntityType.MAJOR, 'maj_1', {
      question: 'Q?',
      answer: 'A',
    });
    expect(added.question).toBe('Q?');
    expect(await service.listFaqs(ContentEntityType.MAJOR, 'maj_1')).toHaveLength(1);
    const updated = await service.updateFaq(ADMIN_ACTOR, ContentEntityType.MAJOR, 'maj_1', 'faq_1', {
      answer: 'B',
    });
    expect(updated.answer).toBe('B');
    await service.removeFaq(ADMIN_ACTOR, ContentEntityType.MAJOR, 'maj_1', 'faq_1');
    expect(repo.deleteFaq).toHaveBeenCalledWith('faq_1', ADMIN_ACTOR.id, null);
  });
});
