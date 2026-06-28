import type { Request, Response } from 'express';
import type { UsersService } from './users.service.js';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.validation.js';
import { ok, created, noContent } from '../../shared/utils/http-response.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export class UsersController {
  constructor(private readonly service: UsersService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const result = await this.service.list(query);
    ok(res, result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const user = await this.service.getById(id);
    ok(res, user);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateUserInput;
    const user = await this.service.create(input);
    created(res, user);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const input = req.body as UpdateUserInput;
    const user = await this.service.update(id, input);
    ok(res, user);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await this.service.delete(id);
    noContent(res);
  });
}