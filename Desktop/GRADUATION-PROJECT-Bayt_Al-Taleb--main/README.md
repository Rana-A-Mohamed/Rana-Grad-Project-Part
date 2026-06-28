# Bayt Al Taleb (بيت الطالب) — Graduation Project

Team scaffold. The full **architecture, folder structure, configs, database
schema, and tests** are in place — but the **implementation files are stubs**
for the team to build. Each stubbed file keeps its doc comment + the list of
expected exports + a `// TODO: implement` marker.

```
.
├── backend/    Node + Express + TypeScript + Prisma + PostgreSQL API
└── frontend/   React + TypeScript + Vite SPA
```

## What's already done (do NOT rewrite)

- **Project structure** — every folder & file is created in the right place.
- **Config / tooling** — `package.json`, `package-lock.json`, `tsconfig`, ESLint,
  Prettier, Vite, Tailwind, Vitest. `npm install` works out of the box.
- **Database schema** — `backend/prisma/schema.prisma` (full) + the search-index SQL.
- **Backend infra/boilerplate (kept full):** db client, logger, HTTP middlewares
  (auth/validation/error/upload/role-guard), error classes, RBAC permission map,
  soft-delete helpers, storage providers, `config/env`.
- **Frontend plumbing (kept full):** Shadcn UI primitives, `utils/cn`, the toast
  hook, `index.css`, `main.tsx`, `config/env`.
- **Tests (kept full)** — `backend/tests/` document the exact expected behavior
  of each module. Use them as the spec for your implementation.
- **Docs** — OpenAPI spec, Postman collection, API.md under `backend/docs/`.

## What YOU implement (the stubs)

Every file marked `// STUB — implement this file`:

- **Backend:** each module's `*.service.ts`, `*.controller.ts`, `*.repository.ts`,
  `*.routes.ts`, `*.dto.ts`, `*.validation.ts`, `*.types.ts`, plus the DI wiring
  in `src/container.ts`, `src/routes.ts`, `src/app.ts`, `src/server.ts`.
- **Frontend:** the API layer (`api/`), `store/`, route guards (`routes/`),
  `layouts/`, `pages/`, and any `features/`.

Tip: run the matching test file to know when your implementation is correct.

## Getting started

### Backend
```bash
cd backend
npm install
cp .env.example .env          # set DATABASE_URL + JWT secrets
# implement the stubs, then:
npm run prisma:migrate
npx prisma db seed
npm run dev                   # http://localhost:4000/api/v1
npm test                      # implement until tests pass
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_BASE_URL=/api/v1 (proxied to backend)
npm run dev                   # http://localhost:5173
```

## Workflow suggestion (team)

1. Pick a module (e.g. `users`). Read its `*.types.ts` stub (expected exports)
   and its test file (`backend/tests/unit/users.service.test.ts`).
2. Implement repository → service → controller → routes (same layering everywhere).
3. Wire it in `container.ts` + `routes.ts`.
4. `npm test` for that module until green. Commit. Open a PR.

> The compiler/tests will fail until the stubs are implemented — that's expected.
