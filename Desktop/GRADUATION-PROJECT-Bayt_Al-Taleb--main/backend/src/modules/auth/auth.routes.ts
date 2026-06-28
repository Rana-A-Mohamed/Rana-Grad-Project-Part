/**
 * Auth routes. Mounted at `/api/v1/auth`.
 * Receives the controller via DI so routing has zero construction logic.
 *
 *   POST /register   public
 *   POST /login      public
 *   POST /refresh    public (presents refresh token)
 *   POST /logout     public (revokes refresh token)
 */

// ┌─────────────────────────────────────────────────────────────┐
// │ STUB — implement this file. (Reference impl in CodeDev.)     │
// └─────────────────────────────────────────────────────────────┘
// File: backend/src/modules/auth/auth.routes.ts
// Expected exports: createAuthRouter
//
// TODO: implement.

import { Router } from 'express';
import type { AuthController } from './auth.controller.js';
import { validate } from '../../infrastructure/http/middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.validation.js';

/**
 * Auth routes — mounted at /api/v1/auth
 *
 *   POST /register   public
 *   POST /login      public
 *   POST /refresh    public (presents refresh token)
 *   POST /logout     public (revokes refresh token)
 */
export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/register', validate({ body: registerSchema }), controller.register);
  router.post('/login',    validate({ body: loginSchema }),    controller.login);
  router.post('/refresh',  validate({ body: refreshSchema }),  controller.refresh);
  router.post('/logout',   validate({ body: logoutSchema }),   controller.logout);

  return router;
}
