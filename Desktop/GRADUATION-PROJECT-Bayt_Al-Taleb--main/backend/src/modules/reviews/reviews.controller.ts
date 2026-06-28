import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { created, ok } from '../../shared/utils/http-response.js';
import { param } from '../../shared/utils/params.js';
import { actorOf } from '../../shared/utils/actor.js';
import type { ReviewsService } from './reviews.service.js';
import type { CreateReviewInput } from './reviews.validation.js';
import { toDto } from './reviews.dto.js';

export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  submit = asyncHandler(async (req: Request, res: Response) => {
    const fileId = param(req, 'fileId');
    const input = req.body as CreateReviewInput;
    const result = await this.service.review(actorOf(req), fileId, input);
    created(res, toDto(result));
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const fileId = param(req, 'fileId');
    const results = await this.service.history(actorOf(req), fileId);
    ok(res, results.map(toDto));
  });
}