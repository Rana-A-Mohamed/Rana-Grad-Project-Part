# Bayt Al Taleb (بيت الطالب) — Backend Foundation

A production-grade, **modular feature-based** backend foundation for an academic
content platform for Arab students. This repository is a **scaffold**: the
architecture, contracts, RBAC, polymorphic content system, file-review
workflow, auth, validation, DI, and tests are all in place. Business features
are meant to be **extended on top of it without reworking the architecture**.

Designed to scale into an LMS, job platform, tutoring platform, or academic hub.

---

## Tech Stack

| Concern        | Choice                          |
| -------------- | ------------------------------- |
| Runtime        | Node.js 20+ (ESM)               |
| Web framework  | Express.js                      |
| Language       | TypeScript (strict)             |
| ORM / DB       | Prisma + PostgreSQL             |
| Validation     | Zod                             |
| Testing        | Vitest + Supertest              |
| Logging        | Pino                            |
| DI             | Manual constructor injection    |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env          # then edit DATABASE_URL & JWT secrets

# 3. Database
npm run prisma:generate       # generate the typed client
npm run prisma:migrate        # create & apply the first migration
npx prisma db seed            # provision the 5 roles + permissions

# 4. Run
npm run dev                   # http://localhost:4000/api/v1  (health: /health)

# 5. Verify
npm run typecheck
npm test
npm run test:coverage
```

---

## Architecture

```
src/
├── modules/            # one folder per feature (see "Anatomy of a Module")
│   ├── auth/  users/  roles/
│   ├── majors/  scholarships/
│   ├── content/        # ⭐ the ONE polymorphic Section + FAQ system
│   ├── files/  reviews/
│   └── search/  contact/
├── shared/             # cross-cutting: errors, rbac, utils, types
├── infrastructure/     # db client, logger, http middlewares
├── config/             # env loading & validation (Zod)
├── container.ts        # composition root — wires everything (DI)
├── routes.ts           # mounts every module router under /api/v1
├── app.ts              # builds the Express app (no listen — testable)
└── server.ts           # process entry: connect db, listen, graceful shutdown
```

### Layering rules (enforced by convention + review)

- **Controllers are thin.** They read validated input, call a service, shape a
  DTO. No business logic, no DB access.
- **Services own all business logic.** They depend on repositories and other
  services **through constructors** — never `new` their own dependencies, never
  touch Express or Prisma's client directly.
- **Repositories are the only layer that touches Prisma.** Thin data access.
- **Validation lives at the edge** via Zod schemas + the `validate` middleware;
  services can assume their inputs are well-formed.

### Dependency Injection

Everything is wired **once** in [`src/container.ts`](src/container.ts) using
manual constructor injection — no decorators, no reflection, no container
library. The whole object graph is visible in one file. This makes units
trivially testable: tests construct a service with mock dependencies instead of
booting a container.

```ts
const repo = new AuthRepository(db);
const service = new AuthService(repo, hasher, tokenService, ttl);
const controller = new AuthController(service);
```

---

## Anatomy of a Module

Every module follows the same shape. **To add a feature, copy this layout:**

```
modules/<name>/
├── <name>.types.ts        # internal domain types (View, *Data)
├── <name>.dto.ts          # response DTOs (the API contract)
├── <name>.validation.ts   # Zod request schemas + inferred input types
├── <name>.repository.ts   # Prisma data access (constructor-injected db)
├── <name>.service.ts      # business logic (constructor-injected deps)
├── <name>.controller.ts   # thin HTTP handlers
└── <name>.routes.ts       # createXRouter(controller, authenticate) factory
```

Then: register the service/controller in `container.ts`, mount the router in
`routes.ts`, and add `tests/unit/<name>.service.test.ts`.

---

## ⭐ Polymorphic Content System (the key architectural decision)

Majors and Scholarships have **no fixed content columns**. All rich content is
modeled as **dynamic, reusable sections and FAQs** attached to any entity via
`(entityType, entityId)`.

There is exactly **ONE** `Section` table and **ONE** `Faq` table — never
`MajorSections` / `ScholarshipSections`. One `ContentService` serves every
owner type. Adding a new content-owning entity (e.g. `COURSE`) is:

1. add a value to the `ContentEntityType` enum in `schema.prisma`,
2. make that module's service implement `EntityExistenceChecker`,
3. register it in `container.ts`:
   `contentService.registerChecker(ContentEntityType.COURSE, courseService)`.

No new tables, no new content service, no schema rework. Because polymorphic
references can't use SQL foreign keys, integrity is enforced in
`ContentService` via the registered existence checkers.

**Endpoints:**
```
GET    /api/v1/content/:entityType/:entityId/sections
POST   /api/v1/content/:entityType/:entityId/sections      (content:manage)
PATCH  /api/v1/content/:entityType/:entityId/sections/:id  (content:manage)
DELETE /api/v1/content/:entityType/:entityId/sections/:id  (content:manage)
# …and the same four for /faqs
```

---

## RBAC

Five roles seeded into the DB: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `MEMBER`,
`VISITOR`. Authorization is **permission-based** (`resource:action` keys), not
role-string checks — so new capabilities are data, defined in
[`src/shared/rbac/permissions.ts`](src/shared/rbac/permissions.ts) and seeded,
without touching route code.

```ts
router.post('/', authenticate, requirePermission(PERMISSIONS.FILES_UPLOAD), handler);
```

`SUPER_ADMIN` implicitly holds every permission.

---

## File Review Workflow

1. A **member** uploads file metadata → recorded as `PENDING`
   (`POST /api/v1/files`).
2. A **moderator** reviews it (`POST /api/v1/files/:fileId/reviews`) with
   `approve` / `reject` + optional comment.
3. `ReviewsService` is the **single authority**: it records the review (an
   immutable audit trail) and transitions the file's status to
   `APPROVED` / `REJECTED`. Only `PENDING` files can be reviewed.
4. History/audit: `GET /api/v1/files/:fileId/reviews`.

---

## API Surface (v1)

| Prefix `/api/v1`        | Purpose                          | Auth                |
| ----------------------- | -------------------------------- | ------------------- |
| `/auth`                 | register, login, refresh, logout | public              |
| `/users`                | admin user management            | `users:*`           |
| `/roles`                | role catalogue + assignment      | `roles:*`           |
| `/majors`               | major metadata                   | read public / write `majors:manage` |
| `/scholarships`         | scholarship metadata             | read public / write `scholarships:manage` |
| `/content/...`          | polymorphic sections & FAQs      | read public / write `content:manage` |
| `/files`                | upload + track (`?mine=true`)    | `files:read/upload` |
| `/files/:id/reviews`    | review workflow + history        | `files:review/read` |
| `/search`               | global search (structure only)   | public              |
| `/contact`              | submit / manage messages         | submit public / manage `contact:manage` |

All responses use a uniform envelope: `{ success: true, data }` or
`{ success: false, error: { code, message, details? } }`.

---

## Search

Structure and interfaces only — no engine yet. `SearchService` delegates to a
pluggable `SearchProvider`; the default `NotImplementedSearchProvider` returns
an empty, well-formed result set. Drop in Postgres FTS / Meilisearch /
OpenSearch by implementing `SearchProvider` and swapping it in `container.ts` —
nothing else changes.

---

## Testing

```bash
npm test                # all tests
npm run test:unit       # services in isolation (mocked deps)
npm run test:integration# full HTTP stack via Supertest (no open port)
npm run test:coverage   # enforces ≥80% overall, ≥90% on critical services
```

- **Unit tests** construct services with mock repositories + fake
  hasher/token (`tests/mocks/fakes.ts`) — no DB, no crypto, fast.
- **Integration tests** import `createApp()` and exercise real middleware,
  validation, RBAC, and error handling in-process.
- **Fixtures** (`tests/fixtures/`) provide typed entity factories.
- Coverage gate is configured in `vitest.config.ts`; thin adapter layers
  (repositories, jwt/bcrypt wrappers) are covered via integration, not
  unit-counted. **Add a service test with each new module.**

---

## Environment Variables

See [`.env.example`](.env.example). All are validated at boot by
[`src/config/env.ts`](src/config/env.ts) — the process exits with a clear
message if any are missing or malformed.

| Var | Purpose |
| --- | ------- |
| `NODE_ENV` | `development` \| `test` \| `production` |
| `PORT` / `API_PREFIX` | HTTP port / API base path (`/api/v1`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | token signing secrets |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | token TTLs (e.g. `15m`, `7d`) |
| `BCRYPT_SALT_ROUNDS` | password hashing cost |
| `CORS_ORIGIN` | allowed origin(s), comma-separated or `*` |
| `LOG_LEVEL` | pino log level |

---

## Extending the Foundation

Add a feature with confidence by following the existing grain:

1. Scaffold `modules/<name>/` (copy the 7-file layout above).
2. Define the Prisma model(s) → `npm run prisma:migrate`.
3. Write the Zod schemas, repository, service (logic here!), thin controller,
   and route factory.
4. Wire it in `container.ts` and mount it in `routes.ts`.
5. Add `tests/unit/<name>.service.test.ts` (+ integration if it has notable
   request flow).
6. `npm run typecheck && npm test` must stay green.

For content-bearing entities, reuse the polymorphic `ContentService` — don't
add per-entity content tables.
