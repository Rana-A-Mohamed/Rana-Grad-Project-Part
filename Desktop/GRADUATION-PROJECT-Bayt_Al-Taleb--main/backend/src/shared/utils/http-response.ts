import type { Response } from 'express';
import type { ApiResponse, Paginated } from '../types/index.js';

/**
 * Tiny helpers so controllers emit a consistent response envelope.
 * Controllers stay thin: validate → call service → `ok(res, result)`.
 */
export function ok<T>(res: Response, data: T, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  return res.status(status).json(body);
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function paginated<T>(res: Response, page: Paginated<T>): Response {
  return ok(res, page);
}
