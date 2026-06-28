import type { College } from '@prisma/client';
import type { Database } from '../../infrastructure/database/prisma.js';
import type { CollegeView, CreateCollegeData, UpdateCollegeData } from './colleges.types.js';

export class CollegesRepository {
  constructor(private readonly db: Database) {}

  private toView(row: any): CollegeView {
    return {
      id: row.id,
      slug: row.slug,
      category: row.category,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      majors: row.majors,
    };
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.db.college.count({ where: { id } });
    return count > 0;
  }

  async findById(id: string): Promise<CollegeView | null> {
    const row = await this.db.college.findUnique({
      where: { id },
      include: {
        majors: {
          where: { isActive: true, deletedAt: null },
        },
      },
    });
    // FIX: Pass through toView() so TypeScript is happy!
    return row ? this.toView(row) : null;
  }

  async list(page: number, pageSize: number): Promise<{ items: CollegeView[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.db.college.findMany({ skip, take: pageSize }),
      this.db.college.count(),
    ]);
    return {
      items: items.map((row) => this.toView(row)),
      total,
    };
  }

  async create(data: CreateCollegeData): Promise<CollegeView> {
    const row = await this.db.college.create({ data });
    return this.toView(row);
  }

  async update(id: string, data: UpdateCollegeData): Promise<CollegeView> {
    const row = await this.db.college.update({
      where: { id },
      data,
    });
    return this.toView(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.college.delete({ where: { id } });
  }

  async countMajors(collegeId: string): Promise<number> {
    return this.db.major.count({ where: { collegeId, deletedAt: null } });
  }
}
