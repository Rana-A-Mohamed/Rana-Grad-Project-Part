import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { RoleName } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../../../shared/errors/app-error.js';
import type { Permission } from '../../../shared/rbac/permissions.js';

/**
 * Authorization guards. Run AFTER `authenticate` so `req.user` is set.
 *
 *   router.post('/', authenticate, requirePermission('files:upload'), handler)
 *   router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), handler)
 *
 * Permission checks are preferred (data-driven, extensible). Role checks exist
 * for the rare case a route maps cleanly to a role rather than a capability.
 */

function ensureAuthenticated(req: Request): NonNullable<Request['user']> {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}

/** Require ALL of the listed permissions. */
export function requirePermission(...required: Permission[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = ensureAuthenticated(req);
    const missing = required.filter((p) => !user.permissions.has(p));
    if (missing.length > 0) {
      throw new ForbiddenError(`Missing permission(s): ${missing.join(', ')}`);
    }
    next();
  };
}

/** Require ANY of the listed permissions. */
export function requireAnyPermission(...anyOf: Permission[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = ensureAuthenticated(req);
    if (!anyOf.some((p) => user.permissions.has(p))) {
      throw new ForbiddenError(`Requires one of: ${anyOf.join(', ')}`);
    }
    next();
  };
}

/** Require the caller's role to be one of the listed roles. */
export function requireRole(...roles: RoleName[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = ensureAuthenticated(req);
    if (!roles.includes(user.role)) {
      throw new ForbiddenError(`Requires role: ${roles.join(' | ')}`);
    }
    next();
  };
}
