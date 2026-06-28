import type { Request, Response } from 'express';
import type { ScholarshipsService } from './scholarships.service.js';
import type { CreateScholarshipInput, UpdateScholarshipInput, ListScholarshipsQuery } from './scholarships.validation.js';
import { ok, created, noContent } from '../../shared/utils/http-response.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export class ScholarshipsController {
  constructor(private readonly service: ScholarshipsService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.list(req.query as unknown as ListScholarshipsQuery);
    ok(res, result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const s = await this.service.getById((req.params as { id: string }).id);
    ok(res, s);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const s = await this.service.create(req.body as CreateScholarshipInput);
    created(res, s);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const s = await this.service.update((req.params as { id: string }).id, req.body as UpdateScholarshipInput);
    ok(res, s);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete((req.params as { id: string }).id, req.user!.id);
    noContent(res);
  });
}