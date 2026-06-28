import type { AuthenticatedUser } from './index.js';

/**
 * Augments Express's Request so `req.user` is strongly typed everywhere.
 * Populated by the auth middleware.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
