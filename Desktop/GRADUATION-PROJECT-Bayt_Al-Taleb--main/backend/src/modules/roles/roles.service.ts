import type { RolesRepository } from './roles.repository.js';
import type { AssignRoleInput } from './roles.validation.js';
import type { RoleDto } from './roles.dto.js';
import { NotFoundError } from '../../shared/errors/app-error.js';

export class RolesService {
  constructor(private readonly repo: RolesRepository) {}

  async list(): Promise<RoleDto[]> {
    const roles = await this.repo.findAll();
    return roles.map(r => ({
      id:          r.id,
      name:        r.name,
      description: r.description,
      createdAt:   r.createdAt,
    }));
  }

  async assignRole(userId: string, input: AssignRoleInput): Promise<void> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundError(`User ${userId} not found`);

    const role = await this.repo.findByName(input.roleName);
    if (!role) throw new NotFoundError(`Role ${input.roleName} not found`);

    await this.repo.assignRoleToUser(userId, role.id);
  }
}