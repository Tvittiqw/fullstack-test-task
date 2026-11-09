# AGENTS.md

Next.js 16 App Router app: three fixed roles, in-memory store, server-enforced permissions.

- In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.

## Plans

- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. Sacrifice grammar for the sake of concision.

## Package manager

npm

## Key commands

```bash
npm run dev                        # development server
npm run build                      # production build
npm test                           # all tests
npx vitest run test/path.test.ts   # single file
npm run lint                       # ESLint + Prettier
npm run typecheck                  # tsc --noEmit
```

## Layout

- `src/shared/` const arrays and types only (`ROLES`, `PERMISSIONS`, API types). Imports nothing from the project.
- `src/server/` everything that runs on the server: `store/`, `access/`, `auth/`, `users/`, `clients/`, `http/`. Imports only `src/server` and `src/shared`.
- `src/app/api/**` route handlers. Import `src/server` only. No logic beyond parse → authorize → service → respond.
- `src/app/**/page.tsx` server components. May import `src/server` for reads and auth.
- `src/ui/` client-safe code: `api-client.ts`, `components/`. Imports `src/shared` only, never `src/server`.
- `'use client'` files import only `src/ui` and `src/shared`.
- `test/` mirrors `src/server`: `unit/`, `api/`, `helpers/`.

## Hard rules

- Permission checks live only in `src/server/access/` and `src/server/auth/`. Nowhere else.
- Role string literals appear only in `src/shared/roles.ts`, the seed, and tests. Branch on `ROLE_POLICY`, never on `role === '...'`.
- Clients are paginated on the server. Never slice in React, never render 1,000 rows.
- The UI hides controls based on `permissions` from `GET /api/auth/me`. That is UX, not enforcement; the server re-checks every request.
- No `any`, no `@ts-ignore`, no code comments. Names and structure carry intent.
- Tests first: write the test file, watch it fail, then implement.

## Counter-intuitive facts

- IT cannot view `/content`. Roles are not ranked; each has its own permission set.
- A manager cannot edit themself (they are not their own report).
- Deactivation is checked on every request, not at login: `requireSession` reloads the user each time.
- `src/proxy.ts` only checks that the `session` cookie exists. It never validates it.
- 403 is a rendered page, not a redirect. Only 401 redirects to `/login`.
- The store is cached on `globalThis` so Next dev HMR does not wipe sessions.
- Passwords are plain text by task requirement.
- In `authorizeUserChange` the last-active-IT check runs before the self-change check. The order is load-bearing: scenario 5 needs two different denial reasons.
- "Is a manager" is a policy property (`userScope === 'reports'`), not a role comparison.

## Adding a fourth role

1. Append it to `ROLES` in `src/shared/roles.ts`.
2. Fix the compile error in `ROLE_POLICY` (`src/server/access/policy.ts`) by adding its row.
3. Add seed accounts in `src/server/store/seed/users.seed.ts`.
4. List them in `README.md`.
5. `npm test`.

Nothing else changes.

## Docs

- [Architecture](docs/ARCHITECTURE.md) — layers, folders, access module, sessions, store
- [Conventions](docs/CONVENTIONS.md) — schemas, errors, naming, types
- [Testing](docs/TESTING.md) — what to test where, helpers
- [Guardrails](docs/GUARDRAILS.md) — approval gates and hard constraints

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
