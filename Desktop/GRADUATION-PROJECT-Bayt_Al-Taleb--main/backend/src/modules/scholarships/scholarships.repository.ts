import type { PrismaClient, Scholarship } from '@prisma/client';
import type { CreateScholarshipData, UpdateScholarshipData } from './scholarships.types.js';

export class ScholarshipsRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(opts: { page: number; limit: number; search?: string }): Promise<{ items: Scholarship[]; total: number }> {
    const skip  = (opts.page - 1) * opts.limit;
    const where = {
      deletedAt: null,
      ...(opts.search ? { OR: [
        { name: { contains: opts.search, mode: 'insensitive' as const } },
        { slug: { contains: opts.search, mode: 'insensitive' as const } },
      ]} : {}),
    };
    const [items, total] = await Promise.all([
      this.db.scholarship.findMany({ where, orderBy: { name: 'asc' }, skip, take: opts.limit }),
      this.db.scholarship.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Scholarship | null> {
    return this.db.scholarship.findFirst({ where: { id, deletedAt: null } });
  }

  async findBySlug(slug: string): Promise<Scholarship | null> {
    return this.db.scholarship.findFirst({ where: { slug, deletedAt: null } });
  }

  async create(data: CreateScholarshipData): Promise<Scholarship> {
    return this.db.scholarship.create({ data });
  }

  async update(id: string, data: UpdateScholarshipData): Promise<Scholarship> {
    return this.db.scholarship.update({ where: { id }, data });
  }

  async softDelete(id: string, deletedById: string, deleteReason?: string): Promise<void> {
    await this.db.scholarship.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById, deleteReason: deleteReason ?? null },
    });
  }
}