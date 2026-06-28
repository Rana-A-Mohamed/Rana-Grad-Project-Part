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

export class ContentRepository {
  constructor(private readonly db: Database) {}

  // ── Sections ────────────────────────────────────────────────
  private sectionToView(row: any): SectionView {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      title: row.title,
      content: row.content,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findSections(entityType: EntityType, entityId: string): Promise<SectionView[]> {
    const rows = await this.db.section.findMany({
      where: { entityType, entityId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => this.sectionToView(row));
  }

  async findSectionById(id: string): Promise<SectionView | null> {
    const row = await this.db.section.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.sectionToView(row) : null;
  }
  async findFaqById(id: string): Promise<FaqView | null> {
    const row = await this.db.faq.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.faqToView(row) : null;
  }
  async createSection(
    entityType: EntityType,
    entityId: string,
    data: CreateSectionData,
  ): Promise<SectionView> {
    const row = await this.db.section.create({
      data: { entityType, entityId, ...data },
    });
    return this.sectionToView(row);
  }

  async updateSection(id: string, data: UpdateSectionData): Promise<SectionView> {
    const row = await this.db.section.update({
      where: { id },
      data,
    });
    return this.sectionToView(row);
  }

  async deleteSection(id: string, deletedById: string, reason?: string): Promise<void> {
    await this.db.section.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById, deleteReason: reason || null },
    });
  }

  // ── FAQs ─────────────────────────────────────────────────────
  private faqToView(row: any): FaqView {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      question: row.question,
      answer: row.answer,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findFaqs(entityType: EntityType, entityId: string): Promise<FaqView[]> {
    const rows = await this.db.faq.findMany({
      where: { entityType, entityId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => this.faqToView(row));
  }

  async createFaq(entityType: EntityType, entityId: string, data: CreateFaqData): Promise<FaqView> {
    const row = await this.db.faq.create({
      data: { entityType, entityId, ...data },
    });
    return this.faqToView(row);
  }

  async updateFaq(id: string, data: UpdateFaqData): Promise<FaqView> {
    const row = await this.db.faq.update({
      where: { id },
      data,
    });
    return this.faqToView(row);
  }

  async deleteFaq(id: string, deletedById: string, reason?: string): Promise<void> {
    await this.db.faq.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById, deleteReason: reason || null },
    });
  }
}
