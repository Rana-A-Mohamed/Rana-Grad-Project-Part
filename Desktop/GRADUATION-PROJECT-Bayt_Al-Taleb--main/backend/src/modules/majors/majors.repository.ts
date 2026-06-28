import type { Major, Prisma } from '@prisma/client';
import type { Database } from '../../infrastructure/database/prisma.js';
import type { CreateMajorData, MajorView, UpdateMajorData } from './majors.types.js';

export class MajorsRepository {
  constructor(private readonly db: Database) {}

  private toView(row: Major): MajorView {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      degree: row.degree,
      isActive: row.isActive,
      collegeId: row.collegeId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.db.major.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  async findById(id: string): Promise<MajorView | null> {
    const row = await this.db.major.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toView(row) : null;
  }

async findBySlug(slug: string): Promise<MajorView | null> {
  const row = await this.db.major.findFirst({
    where: { slug, deletedAt: null },
  });
  return row ? this.toView(row) : null;
}

  async list(params: { skip: number; take: number; search?: string; collegeId?: string; isActive?: boolean }): Promise<{ items: MajorView[]; total: number }> {
    const where: Prisma.MajorWhereInput = { deletedAt: null };
    
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    
    if (params.collegeId !== undefined) {
      where.collegeId = params.collegeId;
    }
    
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [rows, total] = await Promise.all([
      this.db.major.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.major.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toView(row)),
      total,
    };
  }

  async listByCollege(collegeId: string, params: { skip: number; take: number }): Promise<{ items: MajorView[]; total: number }> {
    return this.list({ skip: params.skip, take: params.take, collegeId });
  }

  async create(data: CreateMajorData): Promise<MajorView> {
    const row = await this.db.major.create({ data });
    return this.toView(row);
  }

  async update(id: string, data: UpdateMajorData): Promise<MajorView> {
    const row = await this.db.major.update({
      where: { id },
      data,
    });
    return this.toView(row);
  }

  async softDelete(id: string, deletedById: string, deleteReason?: string): Promise<void> {
    await this.db.major.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
        deleteReason,
      },
    });
  }
}
