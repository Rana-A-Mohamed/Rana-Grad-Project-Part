import type { Request } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';
import type { Actor } from '../../modules/authorization/authorization.types.js';

/**
 * Extract the authenticated caller as an `Actor` (id + role) for service-layer
 * authorization. Throws UnauthorizedError if the request is unauthenticated —
 * a safety net; routes that need an actor already run `authenticate`.
 */
export function actorOf(req: Request): Actor {
  if (!req.user) throw new UnauthorizedError();
  return { id: req.user.id, role: req.user.role };
}
