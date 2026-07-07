# Vuka Repository Cleanup Report

## 1. Removed Files Report

| File | Location | Reason |
|------|----------|--------|
| `middleware.ts` | `lib/supabase/` | Duplicate of `app/lib/supabase/middleware.ts` (byte-for-byte identical) |
| `manifest.json` | `frontend/public/` | Duplicate of `public/manifest.json` (root public served by Next.js) |
| `format-currency.ts` | `frontend/utils/` | Unused - exports `formatKes`/`formatKesCompact` never imported anywhere |
| `idempotency.ts` | `frontend/utils/` | Unused - never imported (backend equivalent at `backend/lib/idempotency.ts` is the canonical version) |
| `tsconfig.tsbuildinfo` | Root | Build artifact, should not be tracked in git |
| `architecture.md` | `docs/` | Duplicate content moved to `documentation/ARCHITECTURE.md` |

## 2. Documentation Consolidation

All project documentation consolidated into `documentation/`:

**Moved from root:**
- `API.md` → `documentation/API.md`
- `ARCHITECTURE.md` → `documentation/ARCHITECTURE.md`
- `BUG_BASH.md` → `documentation/BUG_BASH.md`
- `CONTRIBUTING.md` → `documentation/CONTRIBUTING.md`
- `DEPLOYMENT.md` → `documentation/DEPLOYMENT.md`
- `SECURITY.md` → `documentation/SECURITY.md`
- `TEST_REPORT.md` → `documentation/TEST_REPORT.md`

**Moved from `docs/`:**
- `api-route-map.md` → `documentation/api-route-map.md`
- `architecture-review-report.md` → `documentation/architecture-review-report.md`
- `data-flow-api-guide.md` → `documentation/data-flow-api-guide.md`
- `frontend-spec.md` → `documentation/frontend-spec.md`
- `job-queues.md` → `documentation/job-queues.md`
- `platform-config.md` → `documentation/platform-config.md`
- `route-component-tree.md` → `documentation/route-component-tree.md`
- `scalability-analysis.md` → `documentation/scalability-analysis.md`
- `security-audit.md` → `documentation/security-audit.md`
- `sign-off-checklist.md` → `documentation/sign-off-checklist.md`

**Retained at root:**
- `README.md` — required at repository root
- `LICENSE` — (not present)

## 3. Dependency Report

### Removed Packages

| Package | Type | Reason |
|---------|------|--------|
| `@upstash/ratelimit` | dependency | Not imported in any source file; rate limiting uses Redis directly |
| `bcryptjs` | dependency | Not imported in any source file; Supabase Auth handles password hashing |
| `jsonwebtoken` | dependency | Not imported in any source file; Supabase Auth handles JWT |
| `embla-carousel-react` | dependency | Not imported in any source file |
| `@testing-library/react` | devDependency | Not imported anywhere (only `@testing-library/jest-dom` is used) |
| `@types/bcryptjs` | devDependency | Unused type definitions |
| `@types/jsonwebtoken` | devDependency | Unused type definitions |
| `@types/supertest` | devDependency | Unused type definitions (supertest also removed) |
| `nock` | devDependency | Not imported in any test file |
| `supertest` | devDependency | Not imported in any test file |

### Retained Packages (dependencies)

| Package | Purpose |
|---------|---------|
| `@aws-sdk/client-s3` | S3 file uploads (`app/api/upload/route.ts`) |
| `@aws-sdk/s3-request-presigner` | S3 presigned URLs (`app/api/upload/route.ts`) |
| `@sentry/nextjs` | Error tracking (sentry configs at root) |
| `@serwist/next` | Service worker compilation (`next.config.mjs`) |
| `@serwist/sw` | Service worker runtime (`app/sw.ts`) |
| `@supabase/ssr` | Supabase server-side rendering auth |
| `@supabase/supabase-js` | Supabase client library |
| `@tanstack/react-query` | Data fetching (`app/providers/index.tsx`) |
| `axios` | HTTP client (M-Pesa API calls in `backend/lib/mpesa.ts`) |
| `bullmq` | Background job queue (workers) |
| `clsx` | Classname utility (`backend/lib/utils.ts`) |
| `ioredis` | Redis client (`backend/lib/redis.ts`, workers) |
| `lucide-react` | Icon library (56+ component files) |
| `next` | Framework |
| `nodemailer` | Email sending (`backend/lib/email.ts`) |
| `react` / `react-dom` | UI framework |
| `sharp` | Image optimization (Next.js built-in) |
| `sonner` | Toast notifications (`app/providers/index.tsx`) |
| `tailwind-merge` | Tailwind class merging (`backend/lib/utils.ts`) |
| `uuid` | UUID generation (`frontend/utils/slug.ts`, `backend/lib/idempotency.ts`) |
| `zod` | Schema validation (15 API route files) |
| `zustand` | State management (`frontend/stores/`) |

### Retained Packages (devDependencies)

| Package | Purpose |
|---------|---------|
| `@testing-library/jest-dom` | DOM testing matchers (`vitest.setup.ts`) |
| `@types/node` | Node.js type definitions |
| `@types/nodemailer` | Nodemailer type definitions |
| `@types/uuid` | UUID type definitions |
| `@typescript-eslint/eslint-plugin` | TypeScript ESLint rules |
| `@vitest/coverage-v8` | Test coverage |
| `autoprefixer` | PostCSS autoprefixer |
| `eslint` / `eslint-config-next` | Linting |
| `husky` | Git hooks |
| `lint-staged` | Pre-commit linting |
| `playwright` | E2E testing |
| `postcss` | CSS processing |
| `prettier` | Code formatting |
| `tailwindcss` | CSS framework |
| `tsx` | TypeScript execution (workers, seed) |
| `typescript` | TypeScript compiler |
| `vitest` | Unit testing framework |

## 4. Folder Structure

### Before

```
.root
├── .github/workflows/
├── .husky/
├── app/                    # Next.js App Router
├── backend/                # Services, middleware, workers, lib
├── docs/                   # Documentation
├── frontend/               # Components, hooks, stores, utils
├── lib/supabase/           # <-- duplicate middleware (REMOVED)
├── public/                 # Static assets
├── + root config files     # API.md, ARCHITECTURE.md, etc.
```

### After

```
.root
├── .github/workflows/
├── .husky/
├── app/                    # Next.js App Router
├── backend/                # Services, middleware, workers, lib
├── documentation/          # All project documentation
├── frontend/               # Components, hooks, stores, utils
├── public/                 # Static assets (+ icons moved here)
├── + root config files     # README.md, configs only
```

### Removed Empty Directories

- `app/(dashboard)/admin/disputes/[id]/`
- `app/(public)/offline/`
- `app/api/auth/refresh/`
- `app/api/courses/trainer/me/courses/`
- `app/api/misc/request-email-verification/`
- `app/api/v1/auth/__tests__/`
- `app/dashboard/` (entire subtree)
- `backend/email-templates/`
- `frontend/components/dashboard/`
- `frontend/components/public/`
- `frontend/components/ui/`
- `frontend/components/__tests__/`
- `lib/` (entire subtree, now empty)
- `docs/` (contents moved to documentation/)

## 5. Final Repository Tree

```
C:.
├── .github
│   └── workflows
│       └── ci-cd.yml
├── .husky
│   └── pre-commit
├── app
│   ├── (dashboard)
│   │   ├── admin
│   │   │   ├── config/page.tsx
│   │   │   ├── disputes/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── verifications/page.tsx
│   │   ├── layout.tsx
│   │   ├── trainee
│   │   │   ├── enrolments/[id]/page.tsx
│   │   │   ├── enrolments/page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   └── reviews/page.tsx
│   │   └── trainer
│   │       ├── courses/[id]/page.tsx, new/page.tsx, page.tsx
│   │       ├── earnings/page.tsx
│   │       ├── enrolments/[id]/page.tsx, page.tsx
│   │       ├── page.tsx
│   │       ├── reviews/page.tsx
│   │       └── verification/page.tsx
│   ├── (public)
│   │   ├── course/[slug]/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── trainer/[slug]/page.tsx
│   │   ├── trainers/page.tsx
│   │   └── trust/page.tsx
│   ├── api
│   │   ├── admin/... (8 route files)
│   │   ├── auth/... (6 route files)
│   │   ├── courses/... (2 route files)
│   │   ├── enrolments/... (6 route files)
│   │   ├── health/route.ts
│   │   ├── misc/platform-config/route.ts
│   │   ├── payouts/... (3 route files)
│   │   ├── trainers/... (8 route files)
│   │   ├── upload/route.ts
│   │   ├── users/me/route.ts
│   │   └── v1/... (4 route files)
│   ├── auth
│   │   ├── forgot-password/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   ├── lib/supabase
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   └── server.ts
│   ├── offline/page.tsx
│   ├── providers/index.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── sw.ts
├── backend
│   ├── lib/ (17 modules)
│   ├── middleware/ (3 modules)
│   ├── scripts/test-mpesa.ts
│   ├── services/ (9 modules)
│   └── workers/ (5 workers + 3 tests)
├── documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── BUG_BASH.md
│   ├── CONTRIBUTING.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── TEST_REPORT.md
│   ├── api-route-map.md
│   ├── architecture-review-report.md
│   ├── data-flow-api-guide.md
│   ├── frontend-spec.md
│   ├── job-queues.md
│   ├── platform-config.md
│   ├── route-component-tree.md
│   ├── scalability-analysis.md
│   ├── security-audit.md
│   ├── sign-off-checklist.md
│   └── CLEANUP_REPORT.md
├── frontend
│   ├── components
│   │   ├── auth/protected-route.tsx
│   │   ├── layout/ (4 modules)
│   │   ├── payment/ (2 modules)
│   │   └── shared/ (16 modules)
│   ├── e2e/app.spec.ts
│   ├── hooks/use-debounce.ts
│   ├── stores/ (2 modules)
│   └── utils/ (2 modules: error-handler.ts, slug.ts)
├── public
│   ├── icons/icon.svg
│   ├── manifest.json
│   └── sw.js
├── .dockerignore
├── .env
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── Dockerfile
├── middleware.ts
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── railway.json
├── README.md
├── sentry.client.config.ts
├── sentry.server.config.ts
├── supabase-schema.sql
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
├── vitest.integration.config.ts
├── vitest.integration.setup.ts
└── vitest.setup.ts
```
