import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { created, noContent, ok, paginated } from '../../shared/utils/http-response.js';
import { param } from '../../shared/utils/params.js';
import { actorOf } from '../../shared/utils/actor.js';
import type { ContactService } from './contact.service.js';
import type { ListContactQuery, SubmitContactInput } from './contact.validation.js';
import { toDto } from './contact.dto.js';

export class ContactController {
  constructor(private readonly service: ContactService) {}

  submit = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as SubmitContactInput;
    const result = await this.service.submit(input);
    created(res, toDto(result));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const result = await this.service.getById(id);
    ok(res, toDto(result));
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListContactQuery;
    const result = await this.service.list(query);
    paginated(res, { ...result, items: result.items.map(toDto) });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    await this.service.delete(actorOf(req), id);
    noContent(res);
  });
}
