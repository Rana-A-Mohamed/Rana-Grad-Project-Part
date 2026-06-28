import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { created, noContent, ok, paginated } from '../../src/shared/utils/http-response.js';

/** http-response helper unit tests — envelope shape & status codes. */
describe('http-response helpers', () => {
  const makeRes = () => {
    const res = {
      statusCode: 0,
      body: undefined as unknown,
      status: vi.fn(function (this: Response, code: number) {
        (res as { statusCode: number }).statusCode = code;
        return res;
      }),
      json: vi.fn(function (this: Response, b: unknown) {
        (res as { body: unknown }).body = b;
        return res;
      }),
      send: vi.fn(function (this: Response) {
        return res;
      }),
    };
    return res as unknown as Response & { statusCode: number; body: unknown };
  };

  it('ok wraps data in a success envelope (200)', () => {
    const res = makeRes();
    ok(res, { a: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { a: 1 } });
  });

  it('created returns 201', () => {
    const res = makeRes();
    created(res, { id: 'x' });
    expect(res.statusCode).toBe(201);
  });

  it('noContent returns 204', () => {
    const res = makeRes();
    noContent(res);
    expect(res.statusCode).toBe(204);
  });

  it('paginated wraps a page envelope', () => {
    const res = makeRes();
    paginated(res, { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
    expect(res.body).toMatchObject({ success: true, data: { total: 0 } });
  });
});
