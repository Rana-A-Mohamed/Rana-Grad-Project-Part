import { Prisma } from '@prisma/client';
import type { Database } from '../../infrastructure/database/prisma.js';
import type {
  SearchableType,
  SearchHit,
  SearchProvider,
  SearchQuery,
  SearchResults,
} from './search.types.js';

/**
 * One searchable entity, described declaratively. Adding a future type
 * (e.g. 'college') = append one SearchSource here — no query code changes.
 *
 * SECURITY: `table` and the column lists are hard-coded constants, never user
 * input. The user's term is ALWAYS passed as a bound parameter via Prisma.sql,
 * so these queries are injection-safe.
 */
interface SearchSource {
  type: SearchableType;
  /** Physical table name (Prisma @@map value). */
  table: Prisma.Sql;
  /** SQL expression producing the searchable document (tsvector input). */
  document: Prisma.Sql;
  /** Column selected as the hit `title`. */
  titleColumn: Prisma.Sql;
  /** Column selected as the hit `slug`, or null if the entity has none. */
  slugColumn: Prisma.Sql | null;
}

/** A raw row returned by every per-source query (uniform shape for merging). */
interface RawHit {
  id: string;
  title: string;
  slug: string | null;
  score: number;
}

const SOURCES: SearchSource[] = [
  {
    type: 'major',
    table: Prisma.sql`"majors"`,
    document: Prisma.sql`coalesce(name, '') || ' ' || coalesce(slug, '')`,
    titleColumn: Prisma.sql`name`,
    slugColumn: Prisma.sql`slug`,
  },
  {
    type: 'scholarship',
    table: Prisma.sql`"scholarships"`,
    document: Prisma.sql`coalesce(name, '') || ' ' || coalesce(slug, '')`,
    titleColumn: Prisma.sql`name`,
    slugColumn: Prisma.sql`slug`,
  },
  {
    type: 'file',
    table: Prisma.sql`"files"`,
    document: Prisma.sql`coalesce(title, '') || ' ' || coalesce(description, '')`,
    titleColumn: Prisma.sql`title`,
    slugColumn: null,
  },
];

/**
 * PostgresSearchProvider — global search backed by PostgreSQL Full Text Search.
 *
 * Strategy:
 *   - For each requested type, run a parameterized FTS query
 *     `to_tsvector('simple', <document>) @@ plainto_tsquery('simple', $term)`
 *     ranked by `ts_rank(...)` — this matches the GIN expression indexes in
 *     prisma/sql/001_search_indexes.sql, so it's an index scan (no full scan).
 *   - Soft-deleted rows (deletedAt IS NOT NULL) are excluded.
 *   - Per-source results are merged, sorted by score desc, and paginated.
 *
 * The `'simple'` config (no stemming) makes slugs/short academic terms match
 * literally and predictably. Implements the unchanged SearchProvider interface.
 */
export class PostgresSearchProvider implements SearchProvider {
  constructor(private readonly db: Database) {}

  async search(query: SearchQuery): Promise<SearchResults> {
    const term = query.term.trim();
    const empty: SearchResults = {
      query: term,
      hits: [],
      total: 0,
      page: query.page,
      pageSize: query.pageSize,
    };
    if (!term) return empty;

    const sources = this.selectedSources(query.types);
    if (sources.length === 0) return empty;

    // Run each source query; flatten into a single ranked list.
    const perSource = await Promise.all(sources.map((s) => this.searchSource(s, term)));
    const allHits = perSource.flat().sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const total = allHits.length;
    const start = (query.page - 1) * query.pageSize;
    const hits = allHits.slice(start, start + query.pageSize);

    return { query: term, hits, total, page: query.page, pageSize: query.pageSize };
  }

  private selectedSources(types?: SearchableType[]): SearchSource[] {
    if (!types || types.length === 0) return SOURCES;
    const wanted = new Set(types);
    return SOURCES.filter((s) => wanted.has(s.type));
  }

  /**
   * Run the FTS query for one source. The term is bound (never interpolated);
   * the source's table/columns are trusted constants. Capped result set keeps
   * a single hot term from pulling unbounded rows before the merge.
   */
  private async searchSource(source: SearchSource, term: string): Promise<SearchHit[]> {
    const tsvector = Prisma.sql`to_tsvector('simple', ${source.document})`;
    const tsquery = Prisma.sql`plainto_tsquery('simple', ${term})`;
    const slugSelect = source.slugColumn
      ? Prisma.sql`${source.slugColumn} AS slug`
      : Prisma.sql`NULL AS slug`;

    const rows = await this.db.$queryRaw<RawHit[]>(Prisma.sql`
      SELECT
        id,
        ${source.titleColumn} AS title,
        ${slugSelect},
        ts_rank(${tsvector}, ${tsquery}) AS score
      FROM ${source.table}
      WHERE "deletedAt" IS NULL
        AND ${tsvector} @@ ${tsquery}
      ORDER BY score DESC
      LIMIT 100
    `);

    return rows.map((r) => ({
      type: source.type,
      id: r.id,
      title: r.title,
      ...(r.slug !== null ? { slug: r.slug } : {}),
      score: Number(r.score),
    }));
  }
}
