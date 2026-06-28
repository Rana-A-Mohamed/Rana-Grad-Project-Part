import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleName } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';
import { JwtTokenService } from '../../src/modules/auth/jwt-token.service.js';
import { env } from '../../src/config/env.js';

/**
 * Integration tests for moderator ownership restrictions — exercised through
 * the REAL HTTP stack (auth middleware → permission guard → controller →
 * service → AuthorizationService) via Supertest.
 *
 * A stub Prisma `Database` is injected through buildContainer(db) so no real
 * Postgres is needed: it returns a canned major and answers the assignment
 * `count` query based on which majors the moderator is assigned to.
 *
 * Scenario: moderator `mod_assigned` is assigned to the Nursing major only.
 *   - assigned moderator PATCH   → allowed (200)
 *   - unassigned moderator PATCH → forbidden (403)
 *   - admin PATCH                → allowed (200, ownership bypass)
 */

const tokens = new JwtTokenService({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});

function tokenFor(sub: string, role: RoleName): string {
  return tokens.signAccessToken({ sub, email: `${sub}@example.com`, role });
}

// A real cuid so the route's `z.string().cuid()` param validation passes.
const MAJOR_ID = 'ckv1nursing0000000000000a';

const MAJOR = {
  id: MAJOR_ID,
  slug: 'nursing',
  name: 'Nursing',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

/** Which (moderatorId → majorId) assignments "exist" in the stub DB. */
const ASSIGNMENTS = new Set([`mod_assigned::${MAJOR_ID}`]);

/**
 * Minimal Prisma stub covering only what the major-update flow touches:
 *   major.findUnique (load), major.count (assignment check), major.update.
 */
function makeStubDb(): Database {
  const findOne = async ({ where }: { where: { id: string } }) =>
    where.id === MAJOR.id ? { ...MAJOR } : null;
  const major = {
    findUnique: findOne,
    findFirst: findOne,
    count: async ({
      where,
    }: {
      where: { id: string; moderators?: { some: { id: string } } };
    }) => {
      const modId = where.moderators?.some.id;
      return modId && ASSIGNMENTS.has(`${modId}::${where.id}`) ? 1 : 0;
    },
    update: async ({ data }: { data: { name?: string } }) => ({ ...MAJOR, ...data }),
  };
  return { major } as unknown as Database;
}

const app = createApp(buildContainer(makeStubDb()));

describe('Moderator ownership (integration)', () => {
  it('lets a moderator update an ASSIGNED major (200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/majors/${MAJOR_ID}`)
      .set('Authorization', `Bearer ${tokenFor('mod_assigned', RoleName.MODERATOR)}`)
      .send({ name: 'Nursing Updated' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { name: 'Nursing Updated' } });
  });

  it('forbids an UNASSIGNED moderator updating the major (403)', async () => {
    // `mod_other` has no assignment to maj_nursing → assignment count is 0.
    const res = await request(app)
      .patch(`/api/v1/majors/${MAJOR_ID}`)
      .set('Authorization', `Bearer ${tokenFor('mod_other', RoleName.MODERATOR)}`)
      .send({ name: 'Hijack' });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ success: false, error: { code: 'FORBIDDEN' } });
  });

  it('lets an ADMIN update any major (bypass, 200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/majors/${MAJOR_ID}`)
      .set('Authorization', `Bearer ${tokenFor('admin_1', RoleName.ADMIN)}`)
      .send({ name: 'Admin Edit' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Admin Edit');
  });

  it('rejects unauthenticated major updates (401)', async () => {
    const res = await request(app).patch(`/api/v1/majors/${MAJOR_ID}`).send({ name: 'x' });
    expect(res.status).toBe(401);
  });
});
