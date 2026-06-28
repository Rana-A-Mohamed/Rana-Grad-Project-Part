/**
 * AuthController — thin. It validates nothing (the `validate` middleware did),
 * holds no business logic, and only: reads validated input → calls the
 * service → shapes the response DTO. Fully constructor-injected.
 */

// ┌─────────────────────────────────────────────────────────────┐
// │ STUB — implement this file. (Reference impl in CodeDev.)     │
// └─────────────────────────────────────────────────────────────┘
// File: backend/src/modules/auth/auth.controller.ts
// Expected exports: AuthController
//
// TODO: implement.

import type { Request, Response } from 'express';
import type { AuthService } from './auth.service.js';
import type { RegisterInput, LoginInput, RefreshInput, LogoutInput } from './auth.validation.js';
import { created, ok, noContent } from '../../shared/utils/http-response.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import type { AuthResponseDto } from './auth.dto.js';

/**
 * AuthController — thin HTTP layer.
 * Reads validated input → calls service → shapes DTO → sends response.
 */
export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as RegisterInput;
    const result = await this.service.register(input);
    const dto: AuthResponseDto = { user: result.user, tokens: result.tokens };
    created(res, dto);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as LoginInput;
    const result = await this.service.login(input);
    const dto: AuthResponseDto = { user: result.user, tokens: result.tokens };
    ok(res, dto);
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as RefreshInput;
    const result = await this.service.refresh(input);
    const dto: AuthResponseDto = { user: result.user, tokens: result.tokens };
    ok(res, dto);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as LogoutInput;
    await this.service.logout(input);
    noContent(res);
  });
}
