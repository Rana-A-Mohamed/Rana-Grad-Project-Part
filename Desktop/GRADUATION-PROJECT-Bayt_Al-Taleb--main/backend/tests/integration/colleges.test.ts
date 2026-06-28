import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleName } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';
import { JwtTokenService } from '../../src/modules/auth/jwt-token.service.js';
import { env } from '../../src/config/env.js';

/**
 * Integration tests for the Colleges hierarchy through the REAL HTTP stack.
 * A tiny stub Prisma Database backs colleges + majors so the endpoints run
 * with no Postgres. Engineering(col_eng) has two majors; Medicine(col_med) none.
 */
const tokens = new JwtTokenService({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});
const adminToken = `Bearer ${tokens.signAccess({ sub: 'admin_1', email: 'a@x.io', role: RoleName.ADMIN })}`;

const COL_ENG = 'ckcollegeeng00000000000010';
const COL_MED = 'ckcollegemed00000000000020';

const colleges = [
  { id: COL_ENG, slug: 'engineering', name: 'Engineering', description: null, isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: COL_MED, slug: 'medicine', name: 'Medicine', description: 'Health sciences', isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
];

const majors = [
  { id: 'ckmajorcivil0000000000010', slug: 'civil', name: 'Civil Engineering', isActive: true, collegeId: COL_ENG, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'), deletedAt: null, deletedById: null, deleteReason: null },
  { id: 'ckmajorarch00000000000020', slug: 'architecture', name: 'Architecture', isActive: true, collegeId: COL_ENG, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'), deletedAt: null, deletedById: null, deleteReason: null },
];

function notDeleted(r: { deletedAt: Date | null }, where: Record<string, unknown>): boolean {
  return 'deletedAt' in where && where.deletedAt === null ? r.deletedAt === null : true;
}

function makeStubDb(): Database {
  const college = {
    findUnique: async ({ where }: { where: { id: string } }) =>
      colleges.find((c) => c.id === where.id) ?? null,
    findMany: async ({ skip = 0, take = 20 }: { skip?: number; take?: number } = {}) =>
      colleges.slice(skip, skip + take),
    count: async ({ where }: { where?: { id?: string } } = {}) =>
      where?.id ? colleges.filter((c) => c.id === where.id).length : colleges.length,
    create: async ({ data }: { data: Record<string, unknown> }) => ({ ...colleges[0], ...data }),
  };
  const major = {
    findMany: async ({ where = {}, skip = 0, take = 20 }: { where?: Record<string, unknown>; skip?: number; take?: number } = {}) =>
      majors
        .filter((m) => (where.collegeId ? m.collegeId === where.collegeId : true) && notDeleted(m, where))
        .slice(skip, skip + take),
    count: async ({ where = {} }: { where?: Record<string, unknown> } = {}) =>
      majors.filter((m) => (where.collegeId ? m.collegeId === where.collegeId : true) && notDeleted(m, where)).length,
  };
  return { college, major } as unknown as Database;
}

const app = createApp(buildContainer(makeStubDb()));

describe('Colleges hierarchy (integration)', () => {
  it('GET /colleges lists colleges', async () => {
    const res = await request(app).get('/api/v1/colleges');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
  });

  it('GET /colleges/:id returns one college', async () => {
    const res = await request(app).get(`/api/v1/colleges/${COL_MED}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ slug: 'medicine', description: 'Health sciences' });
  });

  it('GET /colleges/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/colleges/ckunknown00000000000000099');
    expect(res.status).toBe(404);
  });

  it('GET /colleges/:id/majors returns the College -> Majors list', async () => {
    const res = await request(app).get(`/api/v1/colleges/${COL_ENG}/majors`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.items.map((m: { name: string }) => m.name)).toEqual([
      'Civil Engineering',
      'Architecture',
    ]);
  });

  it('GET /colleges/:id/majors is empty for a college with no majors', async () => {
    const res = await request(app).get(`/api/v1/colleges/${COL_MED}/majors`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('public college reads need no auth; create requires auth', async () => {
    const unauth = await request(app).post('/api/v1/colleges').send({ slug: 'law', name: 'Law' });
    expect(unauth.status).toBe(401);

    const created = await request(app)
      .post('/api/v1/colleges')
      .set('Authorization', adminToken)
      .send({ slug: 'law', name: 'Law' });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe('law');
  });

  it('rejects an invalid college slug (422)', async () => {
    const res = await request(app)
      .post('/api/v1/colleges')
      .set('Authorization', adminToken)
      .send({ slug: 'Not A Slug', name: 'X' });
    expect(res.status).toBe(422);
  });
});