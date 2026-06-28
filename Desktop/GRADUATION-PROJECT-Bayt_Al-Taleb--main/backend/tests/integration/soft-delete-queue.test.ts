import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleName } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';
import { JwtTokenService } from '../../src/modules/auth/jwt-token.service.js';
import { env } from '../../src/config/env.js';

/**
 * Integration tests for soft delete + the Deleted Items Queue, through the REAL
 * HTTP stack via Supertest. A tiny in-memory `major` table backs a stub Prisma
 * Database, so the lifecycle (public list → soft delete → queue → restore) runs
 * with no Postgres. Only the queries these endpoints touch are implemented.
 */
const tokens = new JwtTokenService({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});
const tokenFor = (sub: string, role: RoleName) =>
  tokens.signAccessToken({ sub, email: `${sub}@x.io`, role });

const MAJOR_ID = 'ckmajor000000000000000010';

interface Row {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedById: string | null;
  deleteReason: string | null;
}

let rows: Row[];
let audit: unknown[];

function isNotDeleted(r: Row, where: Record<string, unknown>): boolean {
  if ('deletedAt' in where && where.deletedAt === null) return r.deletedAt === null;
  if (where.deletedAt && typeof where.deletedAt === 'object') return r.deletedAt !== null; // { not: null }
  return true;
}

function makeStubDb(): Database {
  const major = {
    findFirst: async ({ where }: { where: { id: string; deletedAt?: unknown } }) =>
      rows.find((r) => r.id === where.id && isNotDeleted(r, where)) ?? null,
    findMany: async ({ where }: { where?: Record<string, unknown> } = {}) =>
      rows.filter((r) => isNotDeleted(r, where ?? {})).map((r) => ({ ...r })),
    count: async ({ where }: { where?: Record<string, unknown> } = {}) =>
      rows.filter((r) => isNotDeleted(r, where ?? {})).length,
    updateMany: async ({
      where,
      data,
    }: {
      where: { id: string; deletedAt?: unknown };
      data: Partial<Row>;
    }) => {
      let count = 0;
      for (const r of rows) {
        if (r.id === where.id && isNotDeleted(r, where)) {
          Object.assign(r, data);
          count++;
        }
      }
      return { count };
    },
    deleteMany: async ({ where }: { where: { id: string } }) => {
      const before = rows.length;
      rows = rows.filter((r) => r.id !== where.id);
      return { count: before - rows.length };
    },
  };
  const auditLog = {
    create: async ({ data }: { data: unknown }) => {
      audit.push(data);
      return data;
    },
  };
  // The queue iterates every registered soft-deletable table; the other four
  // are empty in this test, so a no-op findMany suffices for them.
  const empty = { findMany: async () => [] };
  return { major, auditLog, scholarship: empty, file: empty, section: empty, faq: empty } as unknown as Database;
}

const app = createApp(buildContainer(makeStubDb()));
const SUPER = `Bearer ${tokenFor('sa_1', RoleName.SUPER_ADMIN)}`;

describe('Soft delete + Deleted Items Queue (integration)', () => {
  beforeEach(() => {
    rows = [
      {
        id: MAJOR_ID,
        slug: 'nursing',
        name: 'Nursing',
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
        deletedById: null,
        deleteReason: null,
      },
    ];
    audit = [];
  });

  it('public list shows the major before deletion', async () => {
    const res = await request(app).get('/api/v1/majors');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it('soft delete hides it from public APIs and logs DELETE', async () => {
    const del = await request(app)
      .delete(`/api/v1/majors/${MAJOR_ID}`)
      .set('Authorization', SUPER)
      .send({ reason: 'duplicate' });
    expect(del.status).toBe(204);

    const list = await request(app).get('/api/v1/majors');
    expect(list.body.data.items).toHaveLength(0); // excluded automatically

    expect(audit.some((a) => (a as { action: string }).action === 'DELETE')).toBe(true);
  });

  it('the deleted item appears in the queue with who/when/reason', async () => {
    await request(app)
      .delete(`/api/v1/majors/${MAJOR_ID}`)
      .set('Authorization', SUPER)
      .send({ reason: 'duplicate' });

    const queue = await request(app).get('/api/v1/deleted-items').set('Authorization', SUPER);
    expect(queue.status).toBe(200);
    expect(queue.body.data).toEqual([
      expect.objectContaining({
        entityType: 'MAJOR',
        id: MAJOR_ID,
        label: 'Nursing',
        deletedById: 'sa_1',
        deleteReason: 'duplicate',
      }),
    ]);
  });

  it('restore brings it back to public APIs and logs RESTORE', async () => {
    await request(app)
      .delete(`/api/v1/majors/${MAJOR_ID}`)
      .set('Authorization', SUPER)
      .send({ reason: 'oops' });

    const restore = await request(app)
      .post(`/api/v1/deleted-items/MAJOR/${MAJOR_ID}/restore`)
      .set('Authorization', SUPER);
    expect(restore.status).toBe(204);

    const list = await request(app).get('/api/v1/majors');
    expect(list.body.data.items).toHaveLength(1); // visible again
    expect(audit.some((a) => (a as { action: string }).action === 'RESTORE')).toBe(true);
  });

  it('permanent delete physically removes the row', async () => {
    await request(app).delete(`/api/v1/majors/${MAJOR_ID}`).set('Authorization', SUPER).send({});
    const del = await request(app)
      .delete(`/api/v1/deleted-items/MAJOR/${MAJOR_ID}`)
      .set('Authorization', SUPER)
      .send({ reason: 'gdpr' });
    expect(del.status).toBe(204);
    expect(rows).toHaveLength(0); // physically gone
  });

  it('forbids a non-super-admin from the queue (403)', async () => {
    const res = await request(app)
      .get('/api/v1/deleted-items')
      .set('Authorization', `Bearer ${tokenFor('admin_1', RoleName.ADMIN)}`);
    expect(res.status).toBe(403);
  });
});
