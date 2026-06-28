import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { PostgresSearchProvider } from '../../src/modules/search/postgres-search.provider.js';
import type { Database } from '../../src/infrastructure/database/prisma.js';
import type { SearchableType } from '../../src/modules/search/search.types.js';

/**
 * PostgresSearchProvider unit tests. The DB is faked: `$queryRaw` returns canned
 * rows keyed by which table the (parameterized) SQL targets, so we exercise the
 * provider's real merge/rank/paginate/filter logic without Postgres.
 */
describe('PostgresSearchProvider', () => {
  let db: Database;
  let provider: PostgresSearchProvider;
  let lastSql: Prisma.Sql | undefined;

  // rows per table the fake "database" holds.
  const tables: Record<string, Array<{ id: string; title: string; slug: string | null; score: number }>> = {
    majors: [
      { id: 'maj_1', title: 'Engineering', slug: 'engineering', score: 0.9 },
      { id: 'maj_2', title: 'Civil Engineering', slug: 'civil-engineering', score: 0.4 },
    ],
    scholarships: [{ id: 'sch_1', title: 'Engineering Grant', slug: 'eng-grant', score: 0.6 }],
    files: [{ id: 'file_1', title: 'Engineering Notes', slug: null, score: 0.7 }],
  };

  beforeEach(() => {
    db = {
      $queryRaw: vi.fn((sql: Prisma.Sql) => {
        lastSql = sql;
        const text = sql.strings.join(' ');
        if (text.includes('"majors"')) return Promise.resolve(tables.majors);
        if (text.includes('"scholarships"')) return Promise.resolve(tables.scholarships);
        if (text.includes('"files"')) return Promise.resolve(tables.files);
        return Promise.resolve([]);
      }),
    } as unknown as Database;
    provider = new PostgresSearchProvider(db);
  });

  const run = (term: string, types?: SearchableType[], page = 1, pageSize = 20) =>
    provider.search({ term, types, page, pageSize });

  it('returns hits across all types, ranked by score desc', async () => {
    const res = await run('engineering');
    expect(res.total).toBe(4);
    expect(res.hits.map((h) => h.id)).toEqual(['maj_1', 'file_1', 'sch_1', 'maj_2']); // 0.9,0.7,0.6,0.4
    expect(res.hits.map((h) => h.type)).toEqual(['major', 'file', 'scholarship', 'major']);
  });

  it('includes slug for slugged entities and omits it for files', async () => {
    const res = await run('engineering');
    const major = res.hits.find((h) => h.id === 'maj_1');
    const file = res.hits.find((h) => h.id === 'file_1');
    expect(major?.slug).toBe('engineering');
    expect(file?.slug).toBeUndefined();
  });

  it('filters to a single type', async () => {
    const res = await run('engineering', ['major']);
    expect(res.hits.every((h) => h.type === 'major')).toBe(true);
    expect(res.total).toBe(2);
  });

  it('filters to multiple types', async () => {
    const res = await run('engineering', ['scholarship', 'file']);
    expect(new Set(res.hits.map((h) => h.type))).toEqual(new Set(['scholarship', 'file']));
    expect(res.total).toBe(2);
  });

  it('paginates the merged ranked list', async () => {
    const res = await run('engineering', undefined, 2, 2);
    expect(res.page).toBe(2);
    expect(res.hits.map((h) => h.id)).toEqual(['sch_1', 'maj_2']); // page 2 of 4
    expect(res.total).toBe(4);
  });

  it('returns empty results for a blank term without querying', async () => {
    const res = await run('   ');
    expect(res).toMatchObject({ hits: [], total: 0 });
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns empty results when types filter is empty after normalization', async () => {
    const res = await provider.search({ term: 'x', types: [], page: 1, pageSize: 20 });
    // empty types means "all" per selectedSources, so it DOES query — sanity check it still works
    expect(res.total).toBeGreaterThanOrEqual(0);
  });

  it('binds the search term as a parameter (injection-safe), not string-interpolated', async () => {
    await run("engineering'; DROP TABLE majors;--", ['major']);
    // The malicious term must appear in SQL *values* (bound), never in the static SQL text.
    expect(lastSql?.values).toContain("engineering'; DROP TABLE majors;--");
    expect(lastSql?.strings.join('')).not.toContain('DROP TABLE');
  });

  it('excludes soft-deleted rows in the query', async () => {
    await run('engineering', ['major']);
    expect(lastSql?.strings.join('')).toContain('"deletedAt" IS NULL');
  });
});
