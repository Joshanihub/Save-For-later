---
trigger: always_on
---

NOTEWISE IDE RULES

1) Privacy and trust
- Treat privacy as default.
- Encrypt all sensitive offline data.
- Never use dark patterns, manipulative UX, or hidden tracking.
- Never sell user data or add third-party ads to core features.
- Keep sync status visible and never fail silently. 

2) Offline-first behavior
- Every feature must work offline first.
- Network access is an enhancement, not a requirement.
- Sync failures must be graceful and visible to the user.
- Offline testing is mandatory before merge. 

3) TypeScript and code style
- Use explicit types everywhere.
- No `any`, no implicit `any`, no unsafe assertions in production.
- Use clear names for files, variables, functions, and interfaces.
- Prefer functional components with hooks.
- Keep components and hooks small and focused. 

4) Hooks and imports
- Custom hooks must start with `use`.
- Hooks only run in components or other hooks.
- Always include dependency arrays explicitly.
- Organize imports in this order:
  React/external → internal absolute → relative → styles. :contentReference[oaicite:4]{index=4}

5) Architecture
- UI may use hooks only.
- Hooks may use services.
- Services may use the data layer.
- UI must not call services directly.
- No circular dependencies. :contentReference[oaicite:5]{index=5}

6) State management
- Use Zustand for UI state and user preferences.
- Use React Query for server state and async operations.
- Use `useState` for local form and component state.
- Do not mix state tools without a clear reason. :contentReference[oaicite:6]{index=6}

7) Error handling
- Every async function must handle errors.
- Log errors with context.
- Show clear user-facing messages with next steps.
- Never use silent failures or generic “something went wrong” messages. 

8) Security
- Require authentication on every endpoint.
- Enforce RLS on every relevant database query.
- Never store tokens in localStorage.
- Validate all input.
- Use parameterized queries, CORS, CSRF protection, and CSP headers. 

9) Encryption
- Use AES-256-GCM for offline data.
- Derive keys with Argon2, not MD5.
- Generate a fresh random nonce/IV for each encryption.
- Never log or expose keys.
- Do not write custom crypto. :contentReference[oaicite:9]{index=9}

10) Testing
- Minimum coverage: 80% statements/functions/lines, 75% branches.
- Encryption, sync logic, auth, and RLS need 100% coverage.
- Keep tests close to source files.
- Use Cypress or Playwright for E2E.
- Mock API calls in E2E; do not test Supabase directly there. 

11) Performance
- Initial load under 1.5s.
- Search under 100ms for large note sets.
- Note rendering under 300ms for large lists.
- Encryption under 50ms per note.
- Keep the bundle under 300KB gzipped when possible. 

12) Data and database
- Use indexes for filtered queries.
- Avoid `SELECT *` on large tables.
- Paginate large results.
- Avoid N+1 queries.
- Keep subscriptions light. :contentReference[oaicite:12]{index=12}

13) Git and PRs
- Use `<type>(<scope>): <subject>` commit messages.
- Use `type/ticket-short-description` branch names.
- Every PR needs a related ticket, tests, review, and no failing checks.
- Keep PRs small and reviewable. 

14) Deployment
- Never deploy with failing tests, missing secrets, or unverified security.
- Test offline and online behavior before release.
- Have rollback and backup plans ready.
- Use staged rollout or feature flags for risky changes. 

15) Non-negotiables
- No shipping without tests.
- No hardcoded secrets.
- No unencrypted sensitive data.
- No silent failures.
- No data loss.
- No breaking changes without migration.
- No dark patterns.
- No merge without review. :contentReference[oaicite:15]{index=15}