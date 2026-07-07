# Contributing to Vuka

## Code Style

- **TypeScript:** Strict mode (`strict: true` in tsconfig). No `any` type.
- **Formatting:** Use Prettier (default config).
- **Linting:** Run `npm run lint` before committing.
- **Imports:** Use `@/` alias (e.g., `@/lib/config`, `@/services/auth.service`). Group: externals → internals.

## Architecture Rules

1. **API routes are thin.** Parse input, call service, format response. No business logic.
2. **Services are pure functions.** Accept primitives/inputs, return data. No request/response objects.
3. **Workers are async processors.** No HTTP. Handle one job type per file.
4. **All financial changes** go through `TransactionLedger`. Never update `availableBalance` outside a `$transaction`.
5. **Query caching** uses the helpers in `@/lib/cache`. Use `CacheKeys` for key generation.
6. **Sensitive data** (phone, passwords, payment info) must be encrypted at rest or masked in logs.

## Branching Model

```
main         — production-ready, deploys automatically
  develop    — integration branch
    feat/*   — feature branches (squash merge to develop)
    fix/*    — bug fixes
```

## Testing Requirements

- **New service:** Minimum 1 test file covering success, failure, and edge cases.
- **New API route:** Integration test for 200, 4xx responses.
- **Coverage threshold:** 80% lines, functions, branches, statements.
- **Run locally:** `npm run test` before push.

## Pull Request Checklist

- [ ] Code compiles (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] All tests pass (`npm run test`)
- [ ] Coverage ≥ 80% (`npm run test:coverage`)
- [ ] No `console.log` (use structured logging)
- [ ] No secrets exposed
- [ ] Database migration reviewed (if applicable)
- [ ] New env vars added to `.env.example`
- [ ] Documentation updated if behavior changed

## Commit Messages

Follow conventional commits: `type(scope): description`

```
feat(api): add trainer payout endpoint
fix(worker): handle B2C timeout callback
chore(deps): upgrade bullmq to 5.12
docs(api): document payout routes
```
