# Design: Monorepo restructure + Frontend foundation

Date: 2026-06-12
Status: Approved

## Goal

1. Reorganize the existing single-package backend (currently at repo root) into a
   monorepo with `backend/` and `frontend/` folders.
2. Build a React + TypeScript + Vite **frontend foundation only** — no business pages.

## Part 1 — Monorepo restructure

Move every backend file/folder from the repo root into `backend/` using `git mv`
(preserves history). Result:

```
Bayt_Al-Taleb/
├── backend/      ← all former root content: src/ prisma/ tests/ docs/ configs, package.json, .env
├── frontend/     ← new Vite app
├── .gitignore    ← root-level, covers both packages
└── README.md     ← root readme describing the monorepo
```

Constraints / checks:
- `backend/.env` stays git-ignored (the root `.gitignore` must still match it under `backend/`).
- Swagger reads `../docs/openapi.yaml` relative to `src/app.ts`; that stays correct inside `backend/`.
- After the move: `cd backend && npx tsc --noEmit` and `npm test` must still pass.
- Backend npm scripts / Prisma paths are relative to the package, so they keep working from `backend/`.

## Part 2 — Frontend foundation (`frontend/`)

### Stack
Vite + React 18 + TypeScript · React Router v6 · Axios · TanStack Query v5 ·
Tailwind CSS · Shadcn UI.

### Folder structure (`frontend/src/`)
`api/  components/  features/  hooks/  layouts/  pages/  routes/  services/  store/  types/  utils/`

### Units to build (foundation only)

| Unit | File | Responsibility | Depends on |
|---|---|---|---|
| Env/config | `src/config/env.ts` | typed `import.meta.env` access (API base URL) | — |
| Token storage | `src/services/token-storage.ts` | get/set/clear access + refresh tokens (localStorage) | — |
| Axios instance | `src/api/client.ts` | baseURL from env; request interceptor adds Bearer; response interceptor unwraps `{success,data}` errors and handles 401 (clear tokens + redirect) | token-storage, env |
| Auth API | `src/api/auth.api.ts` | login/register/refresh/logout request fns | client |
| Query client | `src/api/query-client.ts` | TanStack QueryClient with sane defaults | — |
| Types | `src/types/*.ts` | `RoleName`, `User`, `ApiResponse<T>`, `ApiError` (mirror backend) | — |
| Auth context | `src/store/auth-context.tsx` | holds user+role, exposes login/logout/loading; hydrates from token storage on mount | token-storage, auth.api, types |
| Protected route | `src/routes/ProtectedRoute.tsx` | redirect to /login if unauthenticated | auth-context |
| Role route | `src/routes/RoleRoute.tsx` | allow only listed roles, else /unauthorized | auth-context |
| Router | `src/routes/index.tsx` | route table wiring layouts + placeholder pages | layouts, route guards |
| Layouts | `src/layouts/AppLayout.tsx`, `AuthLayout.tsx` | shell for protected vs public areas | — |
| Error boundary | `src/components/ErrorBoundary.tsx` | catch render errors, show fallback | — |
| Global loading | `src/components/Loading.tsx` | spinner + Suspense/route fallback | — |
| Toast system | Shadcn `toaster` + `src/hooks/use-toast.ts` | global notifications | Shadcn UI |
| Utils | `src/utils/cn.ts` | Tailwind class merge (clsx + tailwind-merge) used by Shadcn | — |
| Placeholder pages | `src/pages/LoginPage.tsx`, `NotFoundPage.tsx`, `UnauthorizedPage.tsx`, `HomePage.tsx` | minimal pages so routing is testable; NOT business pages | — |
| App root | `src/App.tsx`, `src/main.tsx` | compose providers: ErrorBoundary → QueryClientProvider → AuthProvider → RouterProvider → Toaster | all above |

### API connection
- `frontend/.env` → `VITE_API_BASE_URL=/api/v1`; `.env.example` committed.
- `vite.config.ts` dev proxy: `/api` → `http://localhost:4000` (avoids CORS in dev).
- Axios `baseURL = import.meta.env.VITE_API_BASE_URL`.

### Backend response contract (frontend must match)
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code", "message", "details?" } }`
- Auth payload: `data.user` (`{id,email,fullName,role}`) and `data.tokens.{accessToken,refreshToken}`.
- `RoleName`: `SUPER_ADMIN | ADMIN | MODERATOR | MEMBER | VISITOR`.

### Data flow
1. User submits login → `auth.api.login` → backend returns `{user, tokens}`.
2. Auth context stores tokens via token-storage, sets `user` in state.
3. Axios request interceptor attaches `Authorization: Bearer <accessToken>` on every call.
4. On `401`, response interceptor clears tokens and redirects to `/login`.
5. Protected/Role routes read auth context to gate navigation.

### Error handling
- Network/HTTP errors normalized in the axios response interceptor to a consistent `ApiError` shape.
- React render errors caught by `ErrorBoundary` with a friendly fallback.
- User-facing operation feedback via the global toast system.

### Out of scope (explicitly)
- No business pages (dashboard, majors, files, etc.).
- No refresh-token auto-rotation flow yet (interceptor just handles 401 → logout); a TODO note is left for later.
- No tests for the frontend foundation in this pass (scaffold only); backend tests must stay green.

## Verification
- `cd backend && npx tsc --noEmit && npm test` → green.
- `cd frontend && npm run build` (or `tsc --noEmit`) → compiles.
- `cd frontend && npm run dev` → app boots, /login renders, protected route redirects, toast + error boundary wired.
