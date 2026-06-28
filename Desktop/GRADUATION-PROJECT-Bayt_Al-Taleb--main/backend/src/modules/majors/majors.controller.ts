import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { created, noContent, ok, paginated } from '../../shared/utils/http-response.js';
import { param } from '../../shared/utils/params.js';
import { actorOf } from '../../shared/utils/actor.js';
import type { MajorsService } from './majors.service.js';
import type { CreateMajorInput, ListMajorsQuery, UpdateMajorInput } from './majors.validation.js';
import { toDto } from './majors.dto.js';

export class MajorsController {
  constructor(private readonly service: MajorsService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListMajorsQuery;
    const result = await this.service.list(query.page, query.pageSize, query.search, query.collegeId, query.isActive);
    paginated(res, {
      ...result,
      items: result.items.map(toDto),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const result = await this.service.getById(id);
    ok(res, toDto(result));
  });

  getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const slug = param(req, 'slug');
    const result = await this.service.getBySlug(slug);
    ok(res, toDto(result));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateMajorInput;
    const result = await this.service.create(actorOf(req), input);
    created(res, toDto(result));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const input = req.body as UpdateMajorInput;
    const result = await this.service.update(actorOf(req), id, input);
    ok(res, toDto(result));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const { reason } = req.body as { reason?: string };
    await this.service.softDelete(actorOf(req), id, reason);
    noContent(res);
  });
}
