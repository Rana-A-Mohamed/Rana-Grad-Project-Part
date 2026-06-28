import { ConflictError, NotFoundError } from '../../shared/errors/app-error.js';
import { AuditAction, AuditEntityType, ContentEntityType, FileOwnerType } from '@prisma/client';
import type { Actor } from '../authorization/authorization.types.js';
import type { AuthorizationService } from '../authorization/authorization.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { Paginated } from '../../shared/types/index.js';
import type { MajorsRepository } from './majors.repository.js';
import type { MajorView } from './majors.types.js';
import type { CreateMajorInput, UpdateMajorInput } from './majors.validation.js';

export interface CollegeExistenceChecker {
  exists(id: string): Promise<boolean>;
}

export class MajorsService {
  private collegeChecker?: CollegeExistenceChecker;

  constructor(
    private readonly repo: MajorsRepository,
    private readonly authz: AuthorizationService,
    private readonly audit: AuditService,
  ) {}

  registerCollegeChecker(checker: CollegeExistenceChecker): void {
    this.collegeChecker = checker;
  }

  async create(actor: Actor, input: CreateMajorInput): Promise<MajorView> {
    if (input.collegeId) {
      if (!this.collegeChecker) {
        throw new Error('CollegeChecker not registered');
      }
      const collegeExists = await this.collegeChecker.exists(input.collegeId);
      if (!collegeExists) {
        throw new NotFoundError('College not found');
      }
    }

    const existingSlug = await this.repo.findBySlug(input.slug);
    if (existingSlug) {
      throw new ConflictError('Slug already in use');
    }

    const major = await this.repo.create({
      slug: input.slug,
      name: input.name,
      degree: input.degree,
      isActive: input.isActive ?? true,
      collegeId: input.collegeId ?? null,
    });

    await this.audit.log({
      userId: actor.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.MAJOR,
      entityId: major.id,
    });

    return major;
  }

  async update(actor: Actor, id: string, input: UpdateMajorInput): Promise<MajorView> {
    await this.authz.assertCanManageMajor(actor, id);

    const major = await this.repo.findById(id);
    if (!major) {
      throw new NotFoundError('Major not found');
    }

    if (input.slug && input.slug !== major.slug) {
      const existingSlug = await this.repo.findBySlug(input.slug);
      if (existingSlug) {
        throw new ConflictError('Slug already in use');
      }
    }

    if (input.collegeId && input.collegeId !== major.collegeId) {
      if (!this.collegeChecker) {
        throw new Error('CollegeChecker not registered');
      }
      const collegeExists = await this.collegeChecker.exists(input.collegeId);
      if (!collegeExists) {
        throw new NotFoundError('College not found');
      }
    }

    const updated = await this.repo.update(id, {
      slug: input.slug,
      name: input.name,
      degree: input.degree,
      isActive: input.isActive,
      collegeId: input.collegeId,
    });

    await this.audit.log({
      userId: actor.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.MAJOR,
      entityId: updated.id,
      metadata: input,
    });

    return updated;
  }

  async softDelete(actor: Actor, id: string, reason?: string): Promise<void> {
    await this.authz.assertCanManageMajor(actor, id);

    const major = await this.repo.findById(id);
    if (!major) {
      throw new NotFoundError('Major not found');
    }

    await this.repo.softDelete(id, actor.id, reason);

    await this.audit.log({
      userId: actor.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.MAJOR,
      entityId: id,
      reason,
    });
  }

  async getById(id: string): Promise<MajorView> {
    const major = await this.repo.findById(id);
    if (!major) {
      throw new NotFoundError('Major not found');
    }
    return major;
  }

  async getBySlug(slug: string): Promise<MajorView> {
    const major = await this.repo.findBySlug(slug);
    if (!major) {
      throw new NotFoundError('Major not found');
    }
    return major;
  }

  async list(page: number, pageSize: number, search?: string, collegeId?: string, isActive?: boolean): Promise<Paginated<MajorView>> {
    const skip = (page - 1) * pageSize;
    const { items, total } = await this.repo.list({ skip, take: pageSize, search, collegeId, isActive });
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async listByCollege(collegeId: string, page: number, pageSize: number): Promise<Paginated<MajorView>> {
    const skip = (page - 1) * pageSize;
    const { items, total } = await this.repo.listByCollege(collegeId, { skip, take: pageSize });
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async exists(entityType: ContentEntityType, id: string): Promise<boolean> {
    if (entityType !== ContentEntityType.MAJOR) {
      return false;
    }
    return this.repo.exists(id);
  }

  async fileOwnerExists(ownerType: FileOwnerType, id: string): Promise<boolean> {
    if (ownerType !== FileOwnerType.MAJOR) {
      return false;
    }
    return this.repo.exists(id);
  }
}
