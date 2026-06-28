import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { RoleName } from '@prisma/client';
import {
  requirePermission,
  requireRole,
} from '../../src/infrastructure/http/middlewares/role.guard.js';
import { PERMISSIONS, permissionsForRole } from '../../src/shared/rbac/permissions.js';
import { ForbiddenError, UnauthorizedError } from '../../src/shared/errors/app-error.js';

/** RBAC guard unit tests — permission & role enforcement. */
describe('role.guard', () => {
  const reqWith = (role: RoleName): Request =>
    ({
      user: {
        id: 'u',
        email: 'e',
        role,
        permissions: permissionsForRole(role),
      },
    }) as Request;

  const res = {} as Response;

  it('allows a MEMBER to upload files', () => {
    const next = vi.fn();
    requirePermission(PERMISSIONS.FILES_UPLOAD)(reqWith(RoleName.MEMBER), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('forbids a MEMBER from reviewing files', () => {
    expect(() =>
      requirePermission(PERMISSIONS.FILES_REVIEW)(reqWith(RoleName.MEMBER), res, vi.fn()),
    ).toThrow(ForbiddenError);
  });

  it('grants SUPER_ADMIN every permission', () => {
    const next = vi.fn();
    requirePermission(PERMISSIONS.USERS_MANAGE, PERMISSIONS.FILES_REVIEW)(
      reqWith(RoleName.SUPER_ADMIN),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('throws UnauthorizedError when no user is attached', () => {
    expect(() => requirePermission(PERMISSIONS.FILES_READ)({} as Request, res, vi.fn())).toThrow(
      UnauthorizedError,
    );
  });

  it('requireRole enforces an allowed role list', () => {
    const next = vi.fn();
    requireRole(RoleName.ADMIN, RoleName.SUPER_ADMIN)(reqWith(RoleName.ADMIN), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(() => requireRole(RoleName.ADMIN)(reqWith(RoleName.MEMBER), res, vi.fn())).toThrow(
      ForbiddenError,
    );
  });
});
