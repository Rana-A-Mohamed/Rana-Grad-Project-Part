-- ════════════════════════════════════════════════════════════════════════
--  Full-Text Search indexes (PostgreSQL)
--
--  PostgresSearchProvider queries `to_tsvector('simple', <fields>) @@ query`.
--  These GIN expression indexes match those exact expressions, so the planner
--  uses an index scan instead of a full table scan.
--
--  The `'simple'` text-search config (no stemming/stopwords) is used so slugs
--  and short academic terms match literally and predictably across languages.
--
--  Apply with:
--     npx prisma db execute --file prisma/sql/001_search_indexes.sql --schema prisma/schema.prisma
--  (idempotent — safe to re-run).
-- ════════════════════════════════════════════════════════════════════════

-- Majors: name + slug
CREATE INDEX IF NOT EXISTS majors_fts_idx
  ON "majors"
  USING GIN (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(slug, '')));

-- Scholarships: name + slug
CREATE INDEX IF NOT EXISTS scholarships_fts_idx
  ON "scholarships"
  USING GIN (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(slug, '')));

-- Files: title + description
CREATE INDEX IF NOT EXISTS files_fts_idx
  ON "files"
  USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));
