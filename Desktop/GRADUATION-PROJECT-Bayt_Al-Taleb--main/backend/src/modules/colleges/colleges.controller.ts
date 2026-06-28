import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { created, noContent, ok, paginated } from '../../shared/utils/http-response.js';
import { param } from '../../shared/utils/params.js';
import type { CollegesService } from './colleges.service.js';
import type { CreateCollegeInput, ListCollegesQuery, UpdateCollegeInput } from './colleges.validation.js';
import { toDto } from './colleges.dto.js';

export class CollegesController {
  constructor(private readonly service: CollegesService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListCollegesQuery;
    const result = await this.service.list(query.page, query.pageSize);
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

  listMajors = asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const query = req.query as unknown as ListCollegesQuery;
    const result = await this.service.listMajors(id, query.page, query.pageSize);
    paginated(res, result);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateCollegeInput;
    const result = await this.service.create(input);
    created(res, toDto(result));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    const input = req.body as UpdateCollegeInput;
    const result = await this.service.update(id, input);
    ok(res, toDto(result));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = param(req, 'id');
    await this.service.delete(id);
    noContent(res);
  });
}
