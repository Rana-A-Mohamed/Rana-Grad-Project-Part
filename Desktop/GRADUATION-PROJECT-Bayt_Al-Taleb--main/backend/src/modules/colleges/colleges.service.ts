import { ConflictError, NotFoundError } from '../../shared/errors/app-error.js';
import type { Paginated } from '../../shared/types/index.js';
import type { MajorView } from '../majors/majors.types.js';
import type { MajorsService } from '../majors/majors.service.js';
import type { CollegesRepository } from './colleges.repository.js';
import type { CollegeView } from './colleges.types.js';
import type { CreateCollegeInput, UpdateCollegeInput } from './colleges.validation.js';

export class CollegesService {
  constructor(
    private readonly repo: CollegesRepository,
    private readonly majors: MajorsService,
  ) {}

  async create(input: CreateCollegeInput): Promise<CollegeView> {
    return this.repo.create({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      category: input.category ?? '',
    });
  }

  async getById(id: string): Promise<CollegeView> {
    const college = await this.repo.findById(id);
    if (!college) {
      throw new NotFoundError('College not found');
    }
    return college;
  }

  async list(page: number, pageSize: number): Promise<Paginated<CollegeView>> {
    const { items, total } = await this.repo.list(page, pageSize);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async update(id: string, data: UpdateCollegeInput): Promise<CollegeView> {
    await this.getById(id);
    return this.repo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);

    const { total: majorsCount } = await this.majors.listByCollege(id, 1, 1);
    if (majorsCount > 0) {
      throw new ConflictError('College still has majors');
    }

    await this.repo.delete(id);
  }

  async listMajors(
    collegeId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<MajorView>> {
    await this.getById(collegeId);

    const { items, total } = await this.majors.listByCollege(collegeId, page, pageSize);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
