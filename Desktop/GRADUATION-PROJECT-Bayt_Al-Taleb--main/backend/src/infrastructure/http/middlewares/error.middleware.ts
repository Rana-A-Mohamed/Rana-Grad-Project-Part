import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ApiErrorResponse } from '../../../shared/types/index.js';
import { logger } from '../../logger/logger.js';
import { isProduction } from '../../../config/env.js';

/** 404 handler for unmatched routes. Registered after all route mounts. */
export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorResponse = {
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` },
  };
  res.status(404).json(body);
}

/**
 * Central error-handling middleware (must be registered LAST, with 4 args).
 *
 * Maps known error types to a uniform error envelope:
 *   - AppError                       → its own statusCode/code
 *   - Prisma known request errors    → 409/404/400 as appropriate
 *   - anything else                  → 500 (details hidden in production)
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,

  _next: NextFunction,
): void {
  const mapped = mapError(err);

  if (mapped.statusCode >= 500) {
    logger.error({ err }, 'Unhandled error');
  } else {
    logger.warn({ code: mapped.code, message: mapped.message }, 'Handled error');
  }

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: mapped.code,
      message: mapped.message,
      ...(mapped.details !== undefined ? { details: mapped.details } : {}),
    },
  };
  res.status(mapped.statusCode).json(body);
}

interface MappedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

function mapError(err: unknown): MappedError {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return { statusCode: 409, code: 'CONFLICT', message: 'Unique constraint violation' };
      case 'P2025':
        return { statusCode: 404, code: 'NOT_FOUND', message: 'Record not found' };
      case 'P2003':
        return { statusCode: 400, code: 'BAD_REQUEST', message: 'Foreign key constraint failed' };
      default:
        return { statusCode: 400, code: 'DB_ERROR', message: 'Database request error' };
    }
  }

  // Unknown / programmer error.
  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: isProduction
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Internal server error',
  };
}
