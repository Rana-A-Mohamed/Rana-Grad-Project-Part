import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { buildContainer } from '../../src/container.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';

/**
 * Integration tests for GET /search through the REAL HTTP stack (validation →
 * controller → SearchService → PostgresSearchProvider). A stub Prisma Database
 * answers `$queryRaw` per table, so the full request/response contract — query
 * parsing, type filtering, ranking, response shape — is exercised without
 * Postgres. (Actual FTS SQL correctness is covered by the provider unit tests.)
 */
const rows: Record<string, Array<{ id: string; title: string; slug: string | null; score: number }>> = {
  majors: [
    { id: 'maj_1', title: 'Engineering', slug: 'engineering', score: 0.95 },
    { id: 'maj_2', title: 'Civil Engineering', slug: 'civil-engineering', score: 0.3 },
  ],
  scholarships: [{ id: 'sch_1', title: 'Engineering Scholarship', slug: 'eng-sch', score: 0.5 }],
  files: [{ id: 'file_1', title: 'Engineering Exam', slug: null, score: 0.7 }],
};

function makeStubDb(): Database {
  return {
    $queryRaw: (sql: Prisma.Sql) => {
      const text = sql.strings.join(' ');
      if (text.includes('"majors"')) return Promise.resolve(rows.majors);
      if (text.includes('"scholarships"')) return Promise.resolve(rows.scholarships);
      if (text.includes('"files"')) return Promise.resolve(rows.files);
      return Promise.resolve([]);
    },
  } as unknown as Database;
}

const app = createApp(buildContainer(makeStubDb()));

describe('GET /search (integration)', () => {
  it('searches across all types, ranked by relevance', async () => {
    const res = await request(app).get('/api/v1/search').query({ q: 'engineering' });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(4);
    // Ranked: maj_1 (0.95), file_1 (0.7), sch_1 (0.5), maj_2 (0.3)
    expect(res.body.data.hits.map((h: { id: string }) => h.id)).toEqual([
      'maj_1',
      'file_1',
      'sch_1',
      'maj_2',
    ]);
  });

  it('returns the documented hit shape (type, id, title, slug)', async () => {
    const res = await request(app).get('/api/v1/search').query({ q: 'engineering', type: 'major' });
    expect(res.body.data.hits[0]).toMatchObject({
      type: 'major',
      id: 'maj_1',
      title: 'Engineering',
      slug: 'engineering',
    });
  });

  it('filters to majors only via ?type=major', async () => {
    const res = await request(app).get('/api/v1/search').query({ q: 'engineering', type: 'major' });
    expect(res.body.data.hits.every((h: { type: string }) => h.type === 'major')).toBe(true);
    expect(res.body.data.total).toBe(2);
  });

  it('filters to scholarships only', async () => {
    const res = await request(app)
      .get('/api/v1/search')
      .query({ q: 'engineering', type: 'scholarship' });
    expect(res.body.data.hits).toHaveLength(1);
    expect(res.body.data.hits[0].type).toBe('scholarship');
  });

  it('filters to files only', async () => {
    const res = await request(app).get('/api/v1/search').query({ q: 'engineering', type: 'file' });
    expect(res.body.data.hits[0].type).toBe('file');
    expect(res.body.data.hits[0].slug).toBeUndefined();
  });

  it('supports comma-separated ?types=major,file', async () => {
    const res = await request(app)
      .get('/api/v1/search')
      .query({ q: 'engineering', types: 'major,file' });
    expect(new Set(res.body.data.hits.map((h: { type: string }) => h.type))).toEqual(
      new Set(['major', 'file']),
    );
  });

  it('returns empty results when nothing matches', async () => {
    // A DB that matches nothing → well-formed empty result set.
    const localApp = createApp(
      buildContainer({ $queryRaw: () => Promise.resolve([]) } as unknown as Database),
    );
    const res = await request(localApp).get('/api/v1/search').query({ q: 'zzzznotfound' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ hits: [], total: 0 });
  });

  it('rejects a missing query term (422)', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(422);
  });

  it('rejects an invalid type filter (422)', async () => {
    const res = await request(app).get('/api/v1/search').query({ q: 'x', type: 'banana' });
    expect(res.status).toBe(422);
  });
});
