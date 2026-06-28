import type { Request, Response } from 'express';
import type { RolesService } from './roles.service.js';
import type { AssignRoleInput } from './roles.validation.js';
import { ok, noContent } from '../../shared/utils/http-response.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export class RolesController {
  constructor(private readonly service: RolesService) {}

  list = asyncHandler(async (_req: Request, res: Response) => {
    const roles = await this.service.list();
    ok(res, roles);
  });

  assign = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const input = req.body as AssignRoleInput;
    await this.service.assignRole(userId, input);
    noContent(res);
  });
}