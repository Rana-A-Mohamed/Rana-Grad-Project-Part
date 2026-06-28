import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileOwnerType, RoleName } from '@prisma/client';
import { AuthorizationService } from '../../src/modules/authorization/authorization.service.js';
import type {
  Actor,
  AssignmentReader,
} from '../../src/modules/authorization/authorization.types.js';
import { ForbiddenError } from '../../src/shared/errors/app-error.js';

/**
 * AuthorizationService unit tests — the reusable ownership helpers.
 * Scenario mirrors the business example:
 *   Moderator A is assigned Majors {Nursing=maj_n, Pharmacy=maj_p} and
 *   Scholarship {Ministry=sch_m}, and must NOT manage anything else.
 */
describe('AuthorizationService', () => {
  let reader: AssignmentReader;
  let authz: AuthorizationService;

  const MOD: Actor = { id: 'mod_A', role: RoleName.MODERATOR };
  const ADMIN: Actor = { id: 'adm', role: RoleName.ADMIN };
  const SUPER: Actor = { id: 'sa', role: RoleName.SUPER_ADMIN };
  const MEMBER: Actor = { id: 'mem', role: RoleName.MEMBER };

  const assignedMajors = new Set(['maj_n', 'maj_p']);
  const assignedScholarships = new Set(['sch_m']);

  beforeEach(() => {
    reader = {
      isMajorAssigned: vi.fn(async (_u, id) => assignedMajors.has(id)),
      isScholarshipAssigned: vi.fn(async (_u, id) => assignedScholarships.has(id)),
    };
    authz = new AuthorizationService(reader);
  });

  describe('canManageMajor', () => {
    it('moderator CAN manage an assigned major', async () => {
      expect(await authz.canManageMajor(MOD, 'maj_n')).toBe(true);
    });

    it('moderator CANNOT manage an unassigned major', async () => {
      expect(await authz.canManageMajor(MOD, 'maj_cs')).toBe(false);
    });

    it('admin and super admin bypass ownership', async () => {
      expect(await authz.canManageMajor(ADMIN, 'maj_cs')).toBe(true);
      expect(await authz.canManageMajor(SUPER, 'maj_cs')).toBe(true);
      // Bypass means no assignment lookup is performed.
      expect(reader.isMajorAssigned).not.toHaveBeenCalled();
    });

    it('a non-privileged role (member) cannot manage', async () => {
      expect(await authz.canManageMajor(MEMBER, 'maj_n')).toBe(false);
    });
  });

  describe('canManageScholarship', () => {
    it('moderator CAN manage an assigned scholarship', async () => {
      expect(await authz.canManageScholarship(MOD, 'sch_m')).toBe(true);
    });

    it('moderator CANNOT manage an unassigned scholarship', async () => {
      expect(await authz.canManageScholarship(MOD, 'sch_x')).toBe(false);
    });

    it('admin bypasses', async () => {
      expect(await authz.canManageScholarship(ADMIN, 'sch_x')).toBe(true);
    });
  });

  describe('assert* helpers', () => {
    it('assertCanManageMajor resolves for an assigned major', async () => {
      await expect(authz.assertCanManageMajor(MOD, 'maj_p')).resolves.toBeUndefined();
    });

    it('assertCanManageMajor throws ForbiddenError for an unassigned major', async () => {
      await expect(authz.assertCanManageMajor(MOD, 'maj_cs')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('assertCanManageScholarship throws ForbiddenError when unassigned', async () => {
      await expect(authz.assertCanManageScholarship(MOD, 'sch_x')).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
  });

  describe('assertCanManageFileOwner (files/reviews gate)', () => {
    it('does NOT restrict members (they upload via permission, not ownership)', async () => {
      await expect(
        authz.assertCanManageFileOwner(MEMBER, FileOwnerType.MAJOR, 'maj_cs'),
      ).resolves.toBeUndefined();
    });

    it('does NOT restrict admins', async () => {
      await expect(
        authz.assertCanManageFileOwner(ADMIN, FileOwnerType.SCHOLARSHIP, 'sch_x'),
      ).resolves.toBeUndefined();
    });

    it('restricts a moderator to assigned owners (major)', async () => {
      await expect(
        authz.assertCanManageFileOwner(MOD, FileOwnerType.MAJOR, 'maj_n'),
      ).resolves.toBeUndefined();
      await expect(
        authz.assertCanManageFileOwner(MOD, FileOwnerType.MAJOR, 'maj_cs'),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('restricts a moderator to assigned owners (scholarship)', async () => {
      await expect(
        authz.assertCanManageFileOwner(MOD, FileOwnerType.SCHOLARSHIP, 'sch_x'),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });
});
