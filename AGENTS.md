# AGENTS.md

Next.js 16 App Router app: three fixed roles, in-memory store, server-enforced permissions.

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
- `src/app/api/**` route handlers. Import `src/server` only. No logic beyond authorize → parse → service → respond, so 401/403 always come before 400.
- `src/app/**/page.tsx` server components. May import `src/server` for reads and auth.
- `src/ui/` client-safe code. `api-client.ts`, `format.ts`, `hooks/`, `primitives/` (Badge, DetailsList, PageHeader, Pagination, TableSkeleton, ErrorMessage), `layout/` (Nav, SidebarUser, Forbidden) and one folder per feature (`auth/`, `clients/`, `users/`). One component per file, named exports, no barrel files. Imports `src/shared` only, never `src/server`.
- `'use client'` files import only `src/ui` and `src/shared`.
- `test/` mirrors `src/server`: `unit/`, `api/`, `helpers/`.

## Hard rules

- Permission decisions are made only in `src/server/access/` and `src/server/auth/`. Services call those functions and map their `Decision` with `fromDenial`; they never compare roles or scopes themselves.
- Role string literals appear only in `src/shared/roles.ts`, as the keys of `ROLE_POLICY`, in the seed, and in tests. Never compare `role === '...'` and never look up `ROLE_POLICY.<literal>`; go through `policyFor(role)`.
- Clients are paginated on the server. Never slice in React, never render 1,000 rows.
- The UI hides controls based on `permissions` from `GET /api/auth/me`. That is UX, not enforcement; the server re-checks every request.
- No `any`, no `@ts-ignore`, no code comments. Names and structure carry intent.
- Tests first: write the test file, watch it fail, then implement.

## Counter-intuitive facts

- IT cannot view `/content`. Roles are not ranked; each has its own permission set.
- A manager cannot edit themself (they are not their own report). A manager's scope reaches only plain users: a manager or IT account with `managerId` pointing at them is still out of scope, and `POST /api/users` refuses a `managerId` for any role with a user scope.
- Deactivation is checked on every request, not at login: `requireSession` reloads the user each time.
- `src/proxy.ts` only checks that the `session` cookie exists. It never validates it.
- 403 is a rendered page, not a redirect. Only 401 redirects to `/login`.
- The store is cached on `globalThis` so Next dev HMR does not wipe sessions.
- Passwords are plain text by task requirement.
- In `authorizeUserChange` the order is scope → last-active-in-role → self-change. The last two are load-bearing: scenario 5 needs two different denial reasons. The never-zero-active rule applies to every role whose policy has `keepOneActive: true` (today only IT), not to a role name.
- "Is a manager" is a policy property (`userScope === 'reports'`), not a role comparison.

## Adding a fourth role

1. Append it to `ROLES` in `src/shared/roles.ts`.
2. Fix the compile error in `ROLE_POLICY` (`src/server/access/policy.ts`) by adding its row: its permissions, its `userScope` (`'all'`, `'reports'` or `null`), `keepOneActive` (true only if the system must never run out of active users of that role) and its landing route.
3. Fix the compile error in the `MATRIX` table of `test/unit/access/policy.test.ts` with the same row.
4. Add seed accounts in `src/server/store/seed/users.seed.ts`. If the role has `userScope: 'reports'`, update the expected manager lists in `test/unit/users/users.service.test.ts` and `test/api/users.test.ts`.
5. List the accounts in `README.md`.
6. `npm test`.

No route, service, page or component changes. The UI role select reads `ROLES`, the API validates with `z.enum(ROLES)`, and every check goes through `policyFor`.

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
