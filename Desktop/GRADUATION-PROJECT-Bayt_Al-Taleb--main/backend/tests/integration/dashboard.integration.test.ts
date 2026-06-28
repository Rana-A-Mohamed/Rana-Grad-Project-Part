import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { FileStatus, RoleName } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';
import { JwtTokenService } from '../../src/modules/auth/jwt-token.service.js';
import { env } from '../../src/config/env.js';

/**
 * Dashboard integration tests via the REAL HTTP stack (auth → requireRole →
 * controller → service → repository / deleted-items). A stub Prisma Database
 * answers the aggregate queries so no Postgres is needed. The major/file
 * `count` stubs honor the `deletedAt: null` filter to prove soft-delete
 * exclusion end-to-end.
 */
const tokens = new JwtTokenService({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});
const tokenFor = (sub: string, role: RoleName) =>
  tokens.signAccessToken({ sub, email: `${sub}@x.io`, role });

const T0 = new Date('2026-01-01T00:00:00.000Z');

/** Returns the active vs total count for a soft-deletable table. */
function softCount(where: { deletedAt?: unknown; status?: FileStatus } | undefined, active: number, deleted: number) {
  const excludesDeleted = where != null && 'deletedAt' in where && where.deletedAt === null;
  return excludesDeleted ? active : active + deleted;
}

function makeStubDb(): Database {
  // Soft-deleted rows: 1 deleted major, 2 deleted files (for the queue + exclusion).
  const deletedMajor = {
    id: 'maj_del',
    name: 'Deleted Major',
    deletedAt: T0,
    deletedById: 'admin_1',
    deleteReason: 'dup',
  };
  const deletedFiles = [
    { id: 'file_del1', title: 'Old1', deletedAt: T0, deletedById: 'admin_1', deleteReason: null },
    { id: 'file_del2', title: 'Old2', deletedAt: T0, deletedById: 'admin_1', deleteReason: null },
  ];

  const db = {
    user: { count: async () => 7 },
    college: { count: async () => 2 },
    scholarship: {
      count: async ({ where }: { where?: { deletedAt?: unknown } } = {}) => softCount(where, 4, 1),
      findMany: async () => [], // none deleted in queue for scholarships here
    },
    major: {
      count: async ({ where }: { where?: { deletedAt?: unknown } } = {}) => softCount(where, 3, 1),
      findMany: async () => [deletedMajor], // listDeleted() → deleted majors
    },
    file: {
      count: async ({ where }: { where?: { deletedAt?: unknown; status?: FileStatus } } = {}) => {
        if (where?.status === FileStatus.PENDING) return 6;
        if (where?.status === FileStatus.APPROVED) return 3;
        if (where?.status === FileStatus.REJECTED) return 1;
        return softCount(where, 10, 2); // total active = 10, +2 deleted
      },
      findMany: async ({ where }: { where?: { deletedAt?: unknown } } = {}) => {
        const wantsDeleted = where != null && 'deletedAt' in where && where.deletedAt !== null;
        return wantsDeleted ? deletedFiles : []; // listDeleted vs recentUploads
      },
    },
    section: { findMany: async () => [] },
    faq: { findMany: async () => [] },
    contactMessage: {
      count: async ({ where }: { where?: { isHandled?: boolean } } = {}) =>
        where?.isHandled === false ? 2 : 8,
      findMany: async () => [],
    },
    auditLog: { findMany: async () => [] },
  };
  return db as unknown as Database;
}

const app = createApp(buildContainer(makeStubDb()));
const ADMIN = `Bearer ${tokenFor('admin_1', RoleName.ADMIN)}`;
const SUPER = `Bearer ${tokenFor('sa_1', RoleName.SUPER_ADMIN)}`;
const MEMBER = `Bearer ${tokenFor('mem_1', RoleName.MEMBER)}`;

describe('GET /dashboard/stats (integration)', () => {
  it('allows ADMIN and returns correct aggregation', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalUsers: 7,
      totalMajors: 3, // soft-deleted major excluded
      totalColleges: 2,
      totalScholarships: 4, // soft-deleted scholarship excluded
      totalFiles: 10, // soft-deleted files excluded
      pendingFiles: 6,
      approvedFiles: 3,
      rejectedFiles: 1,
      deletedItems: 3, // 1 major + 2 files from the deleted-items system
      totalContactMessages: 8,
      unhandledContactMessages: 2,
    });
  });

  it('allows SUPER_ADMIN', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats').set('Authorization', SUPER);
    expect(res.status).toBe(200);
    expect(res.body.data.totalUsers).toBe(7);
  });

  it('forbids a MEMBER (403)', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats').set('Authorization', MEMBER);
    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated request (401)', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /dashboard/recent-activity (integration)', () => {
  it('returns the four feeds for an admin', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/recent-activity')
      .set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('recentUploads');
    expect(res.body.data).toHaveProperty('recentAuditLogs');
    expect(res.body.data).toHaveProperty('recentContactMessages');
    // The deleted-items feed surfaces the soft-deleted rows from the system.
    expect(res.body.data.recentDeletedItems.map((d: { id: string }) => d.id).sort()).toEqual(
      ['file_del1', 'file_del2', 'maj_del'].sort(),
    );
  });

  it('forbids a MEMBER (403)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/recent-activity')
      .set('Authorization', MEMBER);
    expect(res.status).toBe(403);
  });
});
