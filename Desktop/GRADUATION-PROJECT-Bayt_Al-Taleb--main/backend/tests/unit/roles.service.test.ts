import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleName } from '@prisma/client';
import { RolesService } from '../../src/modules/roles/roles.service.js';
import type { RolesRepository } from '../../src/modules/roles/roles.repository.js';
import { NotFoundError } from '../../src/shared/errors/app-error.js';

/** RolesService unit tests — list catalogue, assign role. */
describe('RolesService', () => {
  let repo: RolesRepository;
  let service: RolesService;

  beforeEach(() => {
    repo = {
      findAll: vi.fn(),
      findByName: vi.fn(),
      assignRoleToUser: vi.fn(),
    } as unknown as RolesRepository;
    service = new RolesService(repo);
  });

  it('lists roles with flattened permission keys', async () => {
    vi.mocked(repo.findAll).mockResolvedValue([
      {
        id: 'r1',
        name: RoleName.MEMBER,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rolePermissions: [{ permission: { key: 'files:upload' } }],
      } as never,
    ]);

    const roles = await service.listRoles();
    expect(roles[0]?.permissions).toEqual(['files:upload']);
  });

  it('assigns an existing role', async () => {
    vi.mocked(repo.findByName).mockResolvedValue({ id: 'r1', name: RoleName.MODERATOR } as never);
    await service.assignRole('usr_1', RoleName.MODERATOR);
    expect(repo.assignRoleToUser).toHaveBeenCalledWith('usr_1', RoleName.MODERATOR);
  });

  it('throws NotFoundError when the role does not exist', async () => {
    vi.mocked(repo.findByName).mockResolvedValue(null);
    await expect(service.assignRole('usr_1', RoleName.ADMIN)).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.assignRoleToUser).not.toHaveBeenCalled();
  });
});
