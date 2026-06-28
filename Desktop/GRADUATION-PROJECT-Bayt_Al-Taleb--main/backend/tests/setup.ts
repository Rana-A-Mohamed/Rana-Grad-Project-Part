/**
 * Vitest global setup. Loaded before any test (see vitest.config.ts).
 * Provides deterministic env so config/env validation passes in CI without a
 * real `.env`. Integration tests that need a real DB override DATABASE_URL.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
  'postgresql://test:test@localhost:5432/bayt_al_taleb_test?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-at-least-16-chars';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-at-least-16-chars';
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.BCRYPT_SALT_ROUNDS ??= '4';
process.env.LOG_LEVEL ??= 'silent';
// Isolated upload dir for tests that exercise the real LocalStorageProvider.
import { join } from 'node:path';
import { tmpdir } from 'node:os';
process.env.UPLOAD_DIR ??= join(tmpdir(), 'bat-test-uploads');
process.env.MAX_FILE_SIZE_MB ??= '5';
