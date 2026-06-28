import { NotFoundError } from '../../shared/errors/app-error.js';
import type { Database } from '../../infrastructure/database/prisma.js';
import type {
  SectionView,
  FaqView,
  CreateSectionData,
  UpdateSectionData,
  CreateFaqData,
  UpdateFaqData,
} from './content.types.js';
import { EntityType } from './content.types.js';
import { ContentRepository } from './content.repository.js';

export class ContentService {
  constructor(
    private readonly repo: ContentRepository,
    private readonly db: Database, // Needed to check if parent entity exists
  ) {}

  // ── Sections Logic ──────────────────────────────────────────
  async getSections(entityType: EntityType, entityId: string): Promise<SectionView[]> {
    return this.repo.findSections(entityType, entityId);
  }

  async addSection(
    entityType: EntityType,
    entityId: string,
    data: CreateSectionData,
  ): Promise<SectionView> {
    // Optional: Verify the parent entity (Major/Scholarship) actually exists
    await this.validateParentEntity(entityType, entityId);
    return this.repo.createSection(entityType, entityId, data);
  }

  async editSection(id: string, data: UpdateSectionData): Promise<SectionView> {
    const existing = await this.repo.findSectionById(id);
    if (!existing) throw new NotFoundError('Section not found');
    return this.repo.updateSection(id, data);
  }

  async removeSection(id: string, userId: string, reason?: string): Promise<void> {
    const existing = await this.repo.findSectionById(id);
    if (!existing) throw new NotFoundError('Section not found');
    await this.repo.deleteSection(id, userId, reason);
  }

  // ── FAQs Logic ──────────────────────────────────────────────
  async getFaqs(entityType: EntityType, entityId: string): Promise<FaqView[]> {
    return this.repo.findFaqs(entityType, entityId);
  }

  async addFaq(entityType: EntityType, entityId: string, data: CreateFaqData): Promise<FaqView> {
    await this.validateParentEntity(entityType, entityId);
    return this.repo.createFaq(entityType, entityId, data);
  }

  async editFaq(id: string, data: UpdateFaqData): Promise<FaqView> {
    const existing = await this.repo.findFaqById(id);
    if (!existing) throw new NotFoundError('FAQ not found');
    return this.repo.updateFaq(id, data);
  }

  async removeFaq(id: string, userId: string, reason?: string): Promise<void> {
    const existing = await this.db.faq.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('FAQ not found');
    await this.repo.deleteFaq(id, userId, reason);
  }

  // Helper to check if Major/Scholarship exists
  private async validateParentEntity(entityType: EntityType, entityId: string) {
    if (entityType === EntityType.MAJOR) {
      const major = await this.db.major.findFirst({ where: { id: entityId, deletedAt: null } });
      if (!major) throw new NotFoundError('Major not found');
    } else if (entityType === EntityType.SCHOLARSHIP) {
      const scholarship = await this.db.scholarship.findFirst({
        where: { id: entityId, deletedAt: null },
      });
      if (!scholarship) throw new NotFoundError('Scholarship not found');
    }
  }
}
