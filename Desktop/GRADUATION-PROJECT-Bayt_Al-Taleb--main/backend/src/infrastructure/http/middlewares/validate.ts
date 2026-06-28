import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ValidationError } from '../../../shared/errors/app-error.js';

/**
 * Request-validation middleware factory.
 *
 * Pass a schema describing any of `body`, `params`, `query`. Each is parsed
 * with Zod; on success the parsed (typed, coerced) value REPLACES the raw one,
 * so controllers read already-validated data. On failure a ValidationError is
 * thrown with a flattened field-error map.
 *
 *   router.post('/', validate({ body: createUserSchema }), controller.create)
 */
export interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) {
        // req.query is read-only on newer Express typings; assign via Object.
        Object.assign(req.query, schemas.query.parse(req.query));
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError('Request validation failed', err.flatten()));
        return;
      }
      next(err);
    }
  };
}
