import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';
import type { TokenService } from '../../../modules/auth/auth.types.js';
import { permissionsForRole } from '../../../shared/rbac/permissions.js';

/**
 * Authentication middleware factory.
 *
 * Verifies the Bearer access token, resolves the caller's role-derived
 * permissions, and attaches a typed `req.user`. Depends only on a
 * `TokenService` interface, so it is fully mockable in tests.
 *
 * Wired in the composition root: `authenticate(tokenService)`.
 */
export function authenticate(tokenService: TokenService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    try {
      const payload = tokenService.verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as import('@prisma/client').RoleName,
       permissions: permissionsForRole(payload.role as import('@prisma/client').RoleName),
      };
      next();
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  };
}

/**
 * Optional authentication: attaches `req.user` if a valid token is present,
 * but never rejects. Useful for endpoints that serve both visitors and
 * authenticated users (e.g. read-only content with extra fields when logged in).
 */
export function optionalAuthenticate(tokenService: TokenService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();
    try {
      const payload = tokenService.verifyAccessToken(header.slice('Bearer '.length).trim());
      req.user = {
        id: payload.sub,
        email: payload.email,
       role: payload.role as import('@prisma/client').RoleName,
       permissions: permissionsForRole(payload.role as import('@prisma/client').RoleName),
      };
    } catch {
      // ignore — treat as anonymous
    }
    next();
  };
}
