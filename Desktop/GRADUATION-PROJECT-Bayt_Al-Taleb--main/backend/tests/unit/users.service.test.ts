// import { beforeEach, describe, expect, it, vi } from 'vitest';
// import { RoleName } from '@prisma/client';
// import { UsersService } from '../../src/modules/users/users.service.js';
// import type { UsersRepository, UserWithRole } from '../../src/modules/users/users.repository.js';
// import type { RolesService } from '../../src/modules/roles/roles.service.js';
// import { ConflictError, NotFoundError } from '../../src/shared/errors/app-error.js';
// import { FakePasswordHasher, makeNotifications } from '../mocks/fakes.js';
// import { makeUser } from '../fixtures/index.js';

// /** UsersService unit tests — create user, update user, role assignment. */
// describe('UsersService', () => {
//   let repo: UsersRepository;
//   let roles: RolesService;
//   let service: UsersService;

//   const userWithRole = (over = {}): UserWithRole =>
//     ({ ...makeUser(over), role: { name: RoleName.MEMBER } }) as UserWithRole;

//   beforeEach(() => {
//     repo = {
//       findById: vi.fn(),
//       findByEmail: vi.fn(),
//       list: vi.fn(),
//       create: vi.fn(),
//       update: vi.fn(),
//     } as unknown as UsersRepository;
//     roles = { assignRole: vi.fn().mockResolvedValue(undefined) } as unknown as RolesService;

//     service = new UsersService(
//       repo,
//       new FakePasswordHasher(),
//       roles,
//       vi.fn().mockResolvedValue('role_member'),
//       makeNotifications().notifications,
//     );
//   });

//   describe('create user', () => {
//     it('hashes the password and persists the user', async () => {
//       vi.mocked(repo.findByEmail).mockResolvedValue(null);
//       vi.mocked(repo.create).mockResolvedValue(userWithRole());

//       const result = await service.create({
//         email: 'student@example.com',
//         password: 'password123',
//         fullName: 'Test Student',
//         role: RoleName.MEMBER,
//       });

//       expect(repo.create).toHaveBeenCalledWith(
//         expect.objectContaining({ passwordHash: 'hashed:password123', roleId: 'role_member' }),
//       );
//       expect(result.role).toBe(RoleName.MEMBER);
//     });

//     it('rejects duplicate emails', async () => {
//       vi.mocked(repo.findByEmail).mockResolvedValue(makeUser());
//       await expect(
//         service.create({
//           email: 'dup@example.com',
//           password: 'password123',
//           fullName: 'Dup',
//           role: RoleName.MEMBER,
//         }),
//       ).rejects.toBeInstanceOf(ConflictError);
//     });
//   });

//   describe('update user', () => {
//     it('updates an existing user', async () => {
//       vi.mocked(repo.findById).mockResolvedValue(userWithRole());
//       vi.mocked(repo.update).mockResolvedValue(userWithRole({ fullName: 'New Name' }));

//       const result = await service.update('usr_1', { fullName: 'New Name' });
//       expect(result.fullName).toBe('New Name');
//     });

//     it('throws NotFoundError for a missing user', async () => {
//       vi.mocked(repo.findById).mockResolvedValue(null);
//       await expect(service.update('missing', { fullName: 'x' })).rejects.toBeInstanceOf(
//         NotFoundError,
//       );
//     });
//   });

//   describe('role assignment', () => {
//     it('delegates assignment to RolesService and returns the refreshed user', async () => {
//       vi.mocked(repo.findById).mockResolvedValue(userWithRole());
//       await service.assignRole('usr_1', RoleName.MODERATOR);
//       expect(roles.assignRole).toHaveBeenCalledWith('usr_1', RoleName.MODERATOR);
//     });
//   });
// });
