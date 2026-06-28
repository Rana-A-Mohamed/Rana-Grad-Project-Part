import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { rm } from 'node:fs/promises';
import { FileStatus, FileType, RoleName } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';
import { JwtTokenService } from '../../src/modules/auth/jwt-token.service.js';
import { env } from '../../src/config/env.js';

/**
 * Integration tests for the production file-upload system through the REAL HTTP
 * stack (Multer → upload middleware → controller → FilesService → real
 * LocalStorageProvider writing to a temp UPLOAD_DIR). A stub Prisma Database
 * backs the `file`/`major` tables so no Postgres is needed.
 */
const tokens = new JwtTokenService({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});
const tokenFor = (sub: string, role: RoleName) =>
  tokens.signAccessToken({ sub, email: `${sub}@x.io`, role });

const MAJOR_ID = 'ckmajorupload0000000000010';

interface FileRow {
  id: string;
  title: string;
  description: string | null;
  type: FileType;
  status: FileStatus;
  storageKey: string;
  mimeType: string | null;
  sizeBytes: number | null;
  ownerType: string;
  ownerId: string;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedById: string | null;
  deleteReason: string | null;
}

const files: FileRow[] = [];
let seq = 0;

function makeStubDb(): Database {
  const file = {
    create: async ({ data }: { data: Partial<FileRow> }) => {
      const row: FileRow = {
        id: `ckfilegen${String((seq += 1)).padStart(16, '0')}`,
        title: data.title ?? '',
        description: data.description ?? null,
        type: data.type as FileType,
        status: data.status as FileStatus,
        storageKey: data.storageKey ?? '',
        mimeType: data.mimeType ?? null,
        sizeBytes: data.sizeBytes ?? null,
        ownerType: data.ownerType ?? 'MAJOR',
        ownerId: data.ownerId ?? '',
        uploadedById: data.uploadedById ?? '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedById: null,
        deleteReason: null,
      };
      files.push(row);
      return row;
    },
    findFirst: async ({ where }: { where: { id: string; deletedAt?: unknown } }) =>
      files.find((f) => f.id === where.id && f.deletedAt === null) ?? null,
  };
  // Major table answers owner-existence + assignment checks.
  const major = {
    count: async ({ where }: { where: { id: string } }) =>
      where.id === MAJOR_ID ? 1 : 0,
  };
  return { file, major } as unknown as Database;
}

const app = createApp(buildContainer(makeStubDb()));
const MEMBER = `Bearer ${tokenFor('mem_1', RoleName.MEMBER)}`;
const PDF = Buffer.from('%PDF-1.4 minimal');

afterAll(async () => {
  await rm(env.UPLOAD_DIR, { recursive: true, force: true });
});

describe('File upload system (integration)', () => {
  it('uploads a valid PDF (multipart) → 201 PENDING with a storageKey', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .set('Authorization', MEMBER)
      .field('title', 'Anatomy Summary')
      .field('type', FileType.SUMMARY)
      .field('ownerType', 'MAJOR')
      .field('ownerId', MAJOR_ID)
      .attach('file', PDF, { filename: 'anatomy.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(FileStatus.PENDING);
    expect(res.body.data.storageKey).toMatch(/^MAJOR\//);
    expect(res.body.data.sizeBytes).toBe(PDF.byteLength);
  });

  it('rejects an unsupported file type → 400', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .set('Authorization', MEMBER)
      .field('title', 'Evil')
      .field('type', FileType.OTHER)
      .field('ownerType', 'MAJOR')
      .field('ownerId', MAJOR_ID)
      .attach('file', Buffer.from('MZ'), { filename: 'evil.exe', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  it('rejects a double-extension filename → 400', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .set('Authorization', MEMBER)
      .field('title', 'Sneaky')
      .field('type', FileType.OTHER)
      .field('ownerType', 'MAJOR')
      .field('ownerId', MAJOR_ID)
      .attach('file', PDF, { filename: 'doc.pdf.exe', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  it('rejects an oversized file → 400', async () => {
    const big = Buffer.alloc((env.MAX_FILE_SIZE_MB + 1) * 1024 * 1024, 1);
    const res = await request(app)
      .post('/api/v1/files')
      .set('Authorization', MEMBER)
      .field('title', 'Huge')
      .field('type', FileType.OTHER)
      .field('ownerType', 'MAJOR')
      .field('ownerId', MAJOR_ID)
      .attach('file', big, { filename: 'huge.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  it('rejects an upload with no file → 400', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .set('Authorization', MEMBER)
      .field('title', 'NoFile')
      .field('type', FileType.OTHER)
      .field('ownerType', 'MAJOR')
      .field('ownerId', MAJOR_ID);
    expect(res.status).toBe(400);
  });

  describe('download permissions', () => {
    it('PENDING file: forbidden to anonymous (403)', async () => {
      const uploaded = files[0]!; // the PENDING file from the first test
      const res = await request(app).get(`/api/v1/files/${uploaded.id}/download`);
      expect(res.status).toBe(403);
    });

    it('PENDING file: uploader can download (200, bytes)', async () => {
      const uploaded = files[0]!;
      const res = await request(app)
        .get(`/api/v1/files/${uploaded.id}/download`)
        .set('Authorization', MEMBER);
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(Buffer.from(res.body).equals(PDF)).toBe(true);
    });

    it('APPROVED file: public download (200, no auth)', async () => {
      const uploaded = files[0]!;
      uploaded.status = FileStatus.APPROVED; // simulate moderator approval
      const res = await request(app).get(`/api/v1/files/${uploaded.id}/download`);
      expect(res.status).toBe(200);
      expect(Buffer.from(res.body).equals(PDF)).toBe(true);
    });

    it('404 for an unknown file id', async () => {
      const res = await request(app)
        .get('/api/v1/files/ckunknownfile000000000099/download')
        .set('Authorization', MEMBER);
      expect(res.status).toBe(404);
    });
  });
});
