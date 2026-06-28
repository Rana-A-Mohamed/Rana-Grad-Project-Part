import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';

/**
 * App-level integration tests via Supertest (in-process, no open port).
 *
 * These exercise the REAL middleware + routing stack — security headers,
 * body parsing, Zod validation, RBAC guards, 404 + error envelope — for the
 * paths that resolve BEFORE any repository/DB call. They run with no Postgres.
 *
 * Deeper integration (actual persistence) belongs in tests that point
 * DATABASE_URL at a disposable test database; the app accepts an injected
 * Container bound to that DB — see `createApp(buildContainer(testDb))`.
 */
const app = createApp();

describe('App wiring', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'bayt-al-taleb' });
  });

  it('unknown routes return the 404 error envelope', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('rejects invalid register payloads with 422 + details', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
    expect(res.body.error.details).toBeDefined();
  });

  it('rejects unauthenticated access to a protected route with 401', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
  });

  it('public search route is reachable without auth', async () => {
    // Inject a stub DB so the route is exercised without a live Postgres;
    // an empty result set keeps this a pure "route reachable + public" check.
    const searchApp = createApp(
      buildContainer({ $queryRaw: () => Promise.resolve([]) } as unknown as Database),
    );
    const res = await request(searchApp).get('/api/v1/search').query({ q: 'calculus' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { hits: [], total: 0 } });
  });
});
