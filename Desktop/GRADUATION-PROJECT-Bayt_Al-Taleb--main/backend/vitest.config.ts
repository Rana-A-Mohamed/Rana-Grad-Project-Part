import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      // Coverage is measured against the layers that hold logic. Thin layers
      // (controllers, routers, repositories) and type-only files are excluded
      // — they are exercised by integration tests, not unit-counted. As new
      // modules add real logic, add their service to the per-file gate below.
      include: ['src/modules/**/*.service.ts', 'src/shared/**/*.ts'],
      exclude: [
        'src/**/*.types.ts',
        'src/**/*.dto.ts',
        'src/**/index.ts',
        'src/shared/types/**',
        // Thin third-party adapters (like repositories) — covered by
        // integration, not unit-counted. Their job is delegation, not logic.
        'src/modules/auth/jwt-token.service.ts',
        'src/modules/auth/bcrypt-password.hasher.ts',
      ],
      // Thresholds enforce the spec: ≥80% overall for tested logic, and ≥90%
      // for the critical business-logic services that ship with the
      // foundation (auth, users, content, majors, scholarships, files, reviews).
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        perFile: false,
      },
    },
  },
});
