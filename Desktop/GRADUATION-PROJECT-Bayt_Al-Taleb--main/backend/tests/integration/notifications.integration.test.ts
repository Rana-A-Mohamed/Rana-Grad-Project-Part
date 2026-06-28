import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { FileStatus, FileType, ReviewAction, RoleName } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';
import { JwtTokenService } from '../../src/modules/auth/jwt-token.service.js';
import { env } from '../../src/config/env.js';

/**
 * Notifications integration tests via the REAL HTTP stack. A stub Prisma
 * Database holds an in-memory `notification` table (+ `user`, `file`, `major`,
 * `fileReview`) so the user endpoints, the admin role broadcast, and an
 * AUTO-GENERATED notification (file approval → ReviewsService → notifyUser)
 * are all exercised without Postgres.
 */
const tokens = new JwtTokenService({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});
const tokenFor = (sub: string, role: RoleName) =>
  tokens.signAccess({ sub, email: `${sub}@x.io`, role });
//signAccess ??
const MEMBER_ID = 'ckmemberusr0000000000000a';
const MAJOR_ID = 'ckmajornotif000000000000a';
const FILE_ID = 'ckfilenotif0000000000000a';

interface NotifRow {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: unknown;
  createdAt: Date;
}

let notifs: NotifRow[];
let seq: number;
let fileStatus: FileStatus;

function makeStubDb(): Database {
  const notification = {
    create: async ({ data }: { data: Omit<NotifRow, 'id' | 'isRead' | 'createdAt'> }) => {
      const row: NotifRow = {
        id: `cknotifgen${String((seq += 1)).padStart(15, '0')}`,
        userId: data.userId,
        title: data.title,
        message: data.message,
        isRead: false,
        metadata: data.metadata ?? null,
        createdAt: new Date(2026, 0, seq),
      };
      notifs.push(row);
      return row;
    },
    createMany: async ({ data }: { data: Array<Omit<NotifRow, 'id' | 'isRead' | 'createdAt'>> }) => {
      for (const d of data) {
        notifs.push({
          id: `cknotifgen${String((seq += 1)).padStart(15, '0')}`,
          userId: d.userId,
          title: d.title,
          message: d.message,
          isRead: false,
          metadata: d.metadata ?? null,
          createdAt: new Date(2026, 0, seq),
        });
      }
      return { count: data.length };
    },
    findMany: async ({ where, skip = 0, take = 20 }: { where: { userId: string }; skip?: number; take?: number }) =>
      notifs
        .filter((n) => n.userId === where.userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(skip, skip + take),
    count: async ({ where }: { where: { userId: string; isRead?: boolean; id?: string } }) =>
      notifs.filter(
        (n) =>
          n.userId === where.userId &&
          (where.isRead === undefined || n.isRead === where.isRead) &&
          (where.id === undefined || n.id === where.id),
      ).length,
    updateMany: async ({
      where,
      data,
    }: {
      where: { userId: string; id?: string; isRead?: boolean };
      data: { isRead: boolean };
    }) => {
      let count = 0;
      for (const n of notifs) {
        if (
          n.userId === where.userId &&
          (where.id === undefined || n.id === where.id) &&
          (where.isRead === undefined || n.isRead === where.isRead)
        ) {
          n.isRead = data.isRead;
          count++;
        }
      }
      return { count };
    },
  };

  // Users: the member (uploader) + two moderators for role broadcast.
  const users = [
    { id: MEMBER_ID, role: { name: RoleName.MEMBER } },
    { id: 'ckmod1usr00000000000000a', role: { name: RoleName.MODERATOR } },
    { id: 'ckmod2usr00000000000000a', role: { name: RoleName.MODERATOR } },
  ];
  const user = {
    findMany: async ({ where }: { where: { role?: { name: RoleName } } }) =>
      users.filter((u) => (where.role ? u.role.name === where.role.name : true)).map((u) => ({ id: u.id })),
  };

  const file = {
    findFirst: async ({ where }: { where: { id: string } }) =>
      where.id === FILE_ID
        ? {
            id: FILE_ID,
            title: 'Notes',
            description: null,
            type: FileType.SUMMARY,
            status: fileStatus,
            storageKey: 'MAJOR/x/a.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 10,
            ownerType: 'MAJOR',
            ownerId: MAJOR_ID,
            uploadedById: MEMBER_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            deletedById: null,
            deleteReason: null,
          }
        : null,
    update: async ({ data }: { where: { id: string }; data: { status: FileStatus } }) => {
      fileStatus = data.status;
      return { id: FILE_ID, status: fileStatus };
    },
  };
  const major = { count: async ({ where }: { where: { id: string } }) => (where.id === MAJOR_ID ? 1 : 0) };
  const fileReview = {
    create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 'rev_1', createdAt: new Date(), ...data }),
  };
  const auditLog = { create: async () => ({}) };

  return { notification, user, file, major, fileReview, auditLog } as unknown as Database;
}

const app = createApp(buildContainer(makeStubDb()));
const MEMBER = `Bearer ${tokenFor(MEMBER_ID, RoleName.MEMBER)}`;
const ADMIN = `Bearer ${tokenFor('ckadminusr0000000000000a', RoleName.ADMIN)}`;
const MODERATOR = `Bearer ${tokenFor('ckmod1usr00000000000000a', RoleName.MODERATOR)}`;

describe('Notifications (integration)', () => {
  beforeEach(() => {
    notifs = [];
    seq = 0;
    fileStatus = FileStatus.PENDING;
  });

  it('creates a self-addressed notification via POST (admin) and lists it', async () => {
    const created = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', ADMIN)
      .send({ title: 'Welcome', message: 'Hello admin' });
    expect(created.status).toBe(201);

    const adminId = 'ckadminusr0000000000000a';
    expect(notifs.filter((n) => n.userId === adminId)).toHaveLength(1);
  });

  it('broadcasts to a target role', async () => {
    const res = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', ADMIN)
      .send({ title: 'Heads up', message: 'Maintenance tonight', targetRole: 'MODERATOR' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ broadcast: true, targetRole: 'MODERATOR', sent: 2 });
  });

  it('forbids a MEMBER from creating announcements (403)', async () => {
    const res = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', MEMBER)
      .send({ title: 'x', message: 'y' });
    expect(res.status).toBe(403);
  });

  it('lists the caller’s notifications and reports unread count', async () => {
    notifs.push(
      { id: 'n1', userId: MEMBER_ID, title: 'A', message: 'a', isRead: false, metadata: null, createdAt: new Date(2026, 0, 1) },
      { id: 'n2', userId: MEMBER_ID, title: 'B', message: 'b', isRead: true, metadata: null, createdAt: new Date(2026, 0, 2) },
    );
    const list = await request(app).get('/api/v1/notifications').set('Authorization', MEMBER);
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(2);

    const count = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', MEMBER);
    expect(count.body.data).toEqual({ unreadCount: 1 });
  });

  it('marks a single notification read', async () => {
    notifs.push({ id: 'ckreadone00000000000000a', userId: MEMBER_ID, title: 'A', message: 'a', isRead: false, metadata: null, createdAt: new Date() });
    const res = await request(app)
      .patch('/api/v1/notifications/ckreadone00000000000000a/read')
      .set('Authorization', MEMBER);
    expect(res.status).toBe(204);
    expect(notifs.find((n) => n.id === 'ckreadone00000000000000a')?.isRead).toBe(true);
  });

  it('marks all notifications read', async () => {
    notifs.push(
      { id: 'm1', userId: MEMBER_ID, title: 'A', message: 'a', isRead: false, metadata: null, createdAt: new Date() },
      { id: 'm2', userId: MEMBER_ID, title: 'B', message: 'b', isRead: false, metadata: null, createdAt: new Date() },
    );
    const res = await request(app).patch('/api/v1/notifications/read-all').set('Authorization', MEMBER);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ updated: 2 });
    expect(notifs.every((n) => n.isRead)).toBe(true);
  });

  it('auto-generates a notification when a file is approved', async () => {
    // Moderator approves the member's file → uploader gets a notification.
    const res = await request(app)
      .post(`/api/v1/files/${FILE_ID}/reviews`)
      .set('Authorization', MODERATOR)
      .send({ action: ReviewAction.APPROVE });
    expect(res.status).toBe(201);

    const memberNotifs = notifs.filter((n) => n.userId === MEMBER_ID);
    expect(memberNotifs).toHaveLength(1);
    expect(memberNotifs[0]?.message).toBe('Your file has been approved');
  });

  it('auto-generates a rejection notification including the reason', async () => {
    const res = await request(app)
      .post(`/api/v1/files/${FILE_ID}/reviews`)
      .set('Authorization', MODERATOR)
      .send({ action: ReviewAction.REJECT, comment: 'Low quality scan' });
    expect(res.status).toBe(201);

    const memberNotifs = notifs.filter((n) => n.userId === MEMBER_ID);
    expect(memberNotifs[0]?.message).toContain('Your file has been rejected');
    expect(memberNotifs[0]?.message).toContain('Low quality scan');
  });

  it('requires authentication (401)', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });
});
