# User Management & Content — design

Date: 2026-11-09. Source: `Fullstack_test_task.docx` (4-hour ceiling, graded on permission rules, server-side enforcement, commit history, agent instructions).

## 1. Intent

A single Next.js app with three fixed roles, an in-memory store, a paginated client directory and a users management view. The graded part is *who may do what and where it is enforced*. Every permission decision runs on the server, in one module, and the HTTP API enforces it without trusting the UI.

Secondary goal: the repo must read like a codebase a stranger's agent can extend (add a fourth role) without breaking any rule. That is what `AGENTS.md` / `CLAUDE.md` / `docs/*` are for.

## 2. Goals, non-goals, anti-goals

**Goals**
- All six "rules that must hold" enforced in route handlers, testable with curl.
- Six walkthrough scenarios pass through both the UI and the API.
- Clients paginated server-side; the browser never receives more than one page.
- Permission decisions concentrated in `src/server/access/`; README lists every decision point and the list is short.
- Adding a fourth role = append to `ROLES`; the compiler then demands exactly one `ROLE_POLICY` row. No other code changes.
- Granular commit history that shows the order of work.

**Non-goals (four-hour budget)**
- Styling beyond readable defaults. No UI library.
- Password hashing (explicitly not wanted).
- Persistence. Data resets on restart by design.
- Web component tests. Tests target the access module, services and route handlers.
- Sorting/filtering, audit trail, Docker: only after the core passes, in that order.

**Anti-goals (failure even if it "works")**
- A permission check that exists only in the UI.
- A role string literal anywhere outside `src/shared/roles.ts` and the seed.
- `any` or `@ts-ignore` in `src/server/**`.
- A route handler that loads all clients and slices in memory on the client side, or a page that renders 1,000 rows.
- A redirect loop or blank page for a logged-in but unauthorised visitor.
- A deactivated user whose existing session keeps working.

## 3. Constraints

- Next.js 16.x (App Router), TypeScript `strict: true`, Node 24, npm.
- No database, no ORM. Module-level in-memory store.
- Real HTTP endpoints under `app/api/**`.
- Unauthenticated visitor to any page → `/login`. Authenticated but unauthorised → visible 403 page (pages) / HTTP 403 (API).
- Seeded accounts only, no signup. Plain-text passwords, all listed in the README.
- House rules (see §12): no code comments, lean code, TDD, manual verification with observed output, concise commits, no co-author trailers.

## 4. Stack and tooling (decided)

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router, `create-next-app` with TypeScript, ESLint, `src/` dir, no Tailwind | What the task asks for; Tailwind adds noise for ungraded styling |
| Validation | `zod` | Smallest common choice; schemas double as request DTOs |
| Tests | `vitest` | Runs route handlers as plain functions, no server, fast; `next/jest` fights ESM server modules |
| Lint/format | ESLint flat config (`eslint-config-next` + `typescript-eslint` type-checked) + Prettier (`singleQuote`, `trailingComma: all`) | Type-aware lint catches unsafe access in the permission layer |
| IDs | `crypto.randomUUID()` | No dependency |
| PRNG for seed | `mulberry32` in-repo (10 lines) | Deterministic clients without a dependency |

Lint rules on top of the scaffold defaults: `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/ban-ts-comment: error`. tsconfig keeps `strict: true` from the scaffold plus `noUnusedLocals`, `noUncheckedIndexedAccess`.

## 5. Repository layout

```
fullstack-test-task/
  AGENTS.md  CLAUDE.md  README.md
  docs/ARCHITECTURE.md  docs/CONVENTIONS.md  docs/TESTING.md  docs/GUARDRAILS.md
  docs/superpowers/                      spec + plan (committed, shows the process)
  .github/workflows/ci.yml                lint · typecheck · test · build
  src/
    proxy.ts                              cookie presence only → /login (Next 16 name for middleware)
    app/
      layout.tsx  page.tsx                root page redirects to landing route or /login
      login/page.tsx
      content/page.tsx  content/client/[id]/page.tsx  content/me/page.tsx
      manage-users/page.tsx
      api/auth/login/route.ts  api/auth/logout/route.ts  api/auth/me/route.ts
      api/users/route.ts  api/users/managers/route.ts  api/users/[id]/route.ts
      api/users/[id]/role/route.ts  api/users/[id]/status/route.ts
      api/clients/route.ts  api/clients/[id]/route.ts
    shared/                               const arrays and types only, imports nothing
      roles.ts  permissions.ts  api-types.ts  (PublicUser, Client, Me, Paginated<T>, ErrorEnvelope)
    server/                               server-only; never imported from src/ui or client components
      store/      store.ts  seed/users.seed.ts  seed/clients.generator.ts  seed/prng.ts
      access/     policy.ts  authorize.ts
      auth/       sessions.ts  require-session.ts  require-permission.ts  credentials.ts
      users/      users.service.ts  users.repository.ts  users.schema.ts
      clients/    clients.service.ts  clients.repository.ts  clients.schema.ts
      http/       errors.ts  respond.ts  handle.ts
      page-auth.ts                        requireSession/requirePermission variants for pages
    ui/                                   client-safe only
      api-client.ts                       fetch wrapper: credentials, 401 → /login, error envelope
      components/  Nav.tsx  Forbidden.tsx  Pagination.tsx  ErrorMessage.tsx
  test/
    unit/access/authorize.test.ts
    unit/users/users.service.test.ts
    unit/clients/clients.service.test.ts
    api/auth.test.ts  api/users.test.ts  api/clients.test.ts
    api/scenarios.test.ts                  the six walkthroughs, API level
    helpers/  reset store, login-as helpers
```

Import boundaries (enforced by review, stated in docs and agent files):
- `src/shared/**` imports nothing from the project. It holds `ROLES`, `PERMISSIONS` and response types, and is the only place either side may import role values from.
- `src/server/**` imports only from `src/server/**` and `src/shared/**`. Never from `src/app` or `src/ui`.
- `src/app/api/**` route handlers import `src/server/**` only. No logic in them beyond parse → authorize → service → respond.
- `src/app/**/page.tsx` (server components) may import `src/server/**` for reads and auth. Client components (`'use client'`) import only `src/ui/**`.
- `src/ui/**` imports `src/shared/**` for types and the `ROLES` list (role `<select>` options) and never `src/server/**`. The browser learns what it *may do* only through the `permissions` list returned by `/api/auth/me`; `ROLES` is display data, not a decision.

## 6. Data model and store

```ts
type UserStatus = 'active' | 'deactivated';
type User = { id: string; fullName: string; email: string; password: string; role: Role; status: UserStatus; managerId: string | null; createdAt: string };
type ClientStatus = 'active' | 'churned';
type Client = { id: string; name: string; company: string; email: string; country: string; status: ClientStatus; createdAt: string };
type Session = { token: string; userId: string; createdAt: string };
type Store = { users: Map<string, User>; clients: Client[]; sessions: Map<string, Session> };
```

- `store.ts` exposes `getStore()` and `resetStore()`. The store object is cached on `globalThis` so it survives Next dev hot reloads (otherwise sessions vanish on every file save). `resetStore()` rebuilds it from the seed; tests call it in `beforeEach`.
- `password` is never serialised. Repositories return `PublicUser = Omit<User, 'password'>`; the only consumer of `password` is `auth/credentials.ts`.
- Seed order: users first, then 1,200 clients from `clients.generator.ts` with a fixed PRNG seed so IDs, order and totals are identical across restarts. Roughly 30% churned. `createdAt` spread over the last three years. Default list order: `createdAt` desc, then `id` for stability.
- Clients are stored sorted once at seed time; pagination is `slice(offset, offset + limit)` over the sorted array plus `length` for total. No per-request sort of 1,200 rows for the default order.

### Seeded users (all passwords plain, listed in README)

| Name | Role | Status | Manager | Purpose |
|---|---|---|---|---|
| Ivan | IT | active | — | scenario 4, 5 |
| Petro | IT | active | — | the other IT, rule 4 |
| Anna | manager | active | — | four reports, scenarios 1–3 |
| Oksana | manager | active | — | manager with no reports |
| Maksym | manager | deactivated | — | deactivated manager |
| Olena, Kateryna, Andrii, Mykola | user | active | Anna | Anna's four reports; Olena is scenario 6 |
| Dmytro | user | active | Maksym | reports to a different (deactivated) manager |
| Yurii | user | deactivated | — | already deactivated |
| Nazar | user | active | — | unassigned, active |

Emails are `<name>@example.com`, lower-case. Passwords are per-account, short and distinct (builder picks, README lists).

## 7. Roles and permissions (the graded part)

### Single source of truth

`src/shared/roles.ts`
```ts
export const ROLES = ['IT', 'manager', 'user'] as const;
export type Role = (typeof ROLES)[number];
```

`src/shared/permissions.ts`
```ts
export const PERMISSIONS = ['users.list', 'users.create', 'users.editProfile', 'users.changeRole', 'users.changeStatus', 'content.view'] as const;
export type Permission = (typeof PERMISSIONS)[number];
```

`src/server/access/policy.ts`
```ts
type UserScope = 'all' | 'reports';
type RolePolicy = { permissions: ReadonlySet<Permission>; userScope: UserScope | null; landingRoute: string };
export const ROLE_POLICY: Record<Role, RolePolicy> = {
  IT:      { permissions: set('users.list','users.create','users.editProfile','users.changeRole','users.changeStatus'), userScope: 'all',     landingRoute: '/manage-users' },
  manager: { permissions: set('users.list','users.editProfile','content.view'),                                         userScope: 'reports', landingRoute: '/content' },
  user:    { permissions: set('content.view'),                                                                          userScope: null,      landingRoute: '/content' },
};
```
`Record<Role, …>` makes a fourth role a compile error until its policy row exists. Nothing else in the codebase branches on `Role` values. Other consumers of `ROLES` are zod's `z.enum(ROLES)` in `users.schema.ts`, the role `<select>` in the UI, and the seed. "Can manage other users" is derived from the policy (`userScope === 'reports'`), never from `role === 'manager'`: `usersService.managerCandidates()` returns active users whose role has that scope, and `POST /api/users` validates `managerId` against the same set.

### Decision function

`src/server/access/authorize.ts` exports:

```ts
type Actor = PublicUser;
type Denial = { kind: 'forbidden' | 'conflict'; code: string; message: string };
type Decision = { ok: true } | { ok: false; denial: Denial };

export function can(actor: Actor, permission: Permission): boolean;
export function canOnUser(actor: Actor, permission: Permission, target: PublicUser): boolean;
export function visibleUsers(actor: Actor, all: PublicUser[]): PublicUser[];
export function authorizeUserChange(actor: Actor, target: PublicUser, change: UserChange, store: Pick<Store, 'users'>): Decision;
```

Rules encoded there, and only there:

| # | Rule | Implementation |
|---|---|---|
| 1 | Only IT creates users, changes role or status | `can(actor, 'users.create' / 'users.changeRole' / 'users.changeStatus')` via policy |
| 2 | Manager edits fullName/email only for users with `managerId === actor.id` | `canOnUser`: `userScope === 'all'` → true; `'reports'` → `target.managerId === actor.id`; `null` → false. Not self, not other managers, not unassigned follow from that single comparison |
| 4 | Never zero active IT | `authorizeUserChange`, checked **first**: target is active IT and change removes that (status → deactivated, or role → non-IT) and `activeItCount(store) === 1` → `conflict`, code `last_active_it` |
| 3 | Nobody deactivates or demotes themselves | `authorizeUserChange`, checked **second**: `target.id === actor.id` and change is `status: 'deactivated'` or `role` away from current → `forbidden`, code `self_change` |
| 5 | Deactivation immediate | Not a policy rule: `require-session.ts` reloads the user per request and rejects `status !== 'active'` (§8) |
| 6 | Fourth role in one place | `ROLES` + `ROLE_POLICY` row |

Scope for listing (`/manage-users`, `GET /api/users`): `visibleUsers` applies `userScope` ('all' → everyone, 'reports' → `managerId === actor.id`). IT sees itself in the list but rule 3 still blocks self status/role change.

HTTP mapping of a `Denial`: `forbidden` → 403, `conflict` → 409. Order matters: since only an active IT can change status, `last_active_it` can only ever fire when the target is the actor, so it must be evaluated before `self_change`. Scenario 5 then reads: Ivan deactivates himself with two active IT → 403 `self_change`; deactivates Petro → 200; deactivates himself again → 409 `last_active_it`. Two different reasons, as required. Unit tests pin this order.

### Where permission decisions are made (README list)

1. `src/server/access/policy.ts` — the matrix.
2. `src/server/access/authorize.ts` — scope and invariant rules.
3. `src/server/auth/require-session.ts` — authentication and active-status check.
4. `src/server/auth/require-permission.ts` — the one wrapper route handlers call; it composes 3 + `can`.
5. `src/server/page-auth.ts` — same composition for pages, producing redirect / Forbidden instead of HTTP codes.

Route handlers and pages contain no other checks.

## 8. Authentication

- `POST /api/auth/login` `{ email, password }` → finds active user by email, compares plain text, creates a session token (`randomUUID`), sets cookie `session` (httpOnly, sameSite=lax, path=/, secure in production), returns the `Me` payload. Wrong credentials and deactivated accounts both answer 401 `invalid_credentials` (no account enumeration).
- `POST /api/auth/logout` → deletes session, clears cookie, 204.
- `GET /api/auth/me` → `{ user: PublicUser, permissions: Permission[], landingRoute: string }`. This is the only way the browser learns what it may do.
- `requireSession(request)`: read cookie → session → user. Missing session, or user missing, or `status !== 'active'` → delete the session if present and throw `HttpError(401, 'unauthenticated')`. Because the user record is reloaded on every request, deactivation takes effect on the deactivated user's *next request*. No token invalidation list is needed; that is the answer to the README's "how you made rule 5 work" question.
- Sessions live in the store (`sessions` map) and reset with it.
- `proxy.ts` (Next 16 middleware) redirects to `/login` when the `session` cookie is absent, for every path except `/login`, `/api/*` and Next internals. It does not validate the session; a stale cookie reaches the page, `requirePageSession` fails, and the page redirects to `/login` with the cookie cleared via the `/api/auth/logout` route the login page calls on mount when a `?expired=1` flag is present. Builder's call on the exact mechanism; the requirement is: stale cookie → single redirect to `/login`, no loop.

## 9. HTTP API

Envelope: success returns the resource JSON directly; errors return `{ error: { code: string; message: string; details?: unknown } }` with the HTTP status. `http/handle.ts` wraps every route handler: catches `HttpError` → envelope, `ZodError` → 400 `validation`, anything else → 500 `internal` (logged).

| Method & path | Permission | Body / query | Response |
|---|---|---|---|
| `POST /api/auth/login` | public | `{ email, password }` | 200 `Me` / 401 |
| `POST /api/auth/logout` | session | — | 204 |
| `GET /api/auth/me` | session | — | 200 `Me` |
| `GET /api/users` | `users.list` | — | 200 `{ items: PublicUser[] }` scoped by `visibleUsers` |
| `GET /api/users/managers` | `users.create` | — | 200 `{ items: PublicUser[] }` active users whose role policy has `userScope: 'reports'`; feeds the manager dropdown |
| `POST /api/users` | `users.create` | `{ fullName, email, password, role, managerId? }` | 201 `PublicUser` / 400 / 409 `email_taken` |
| `PATCH /api/users/:id` | `users.editProfile` + `canOnUser` | `{ fullName?, email? }` at least one | 200 / 403 `out_of_scope` / 404 / 409 |
| `PATCH /api/users/:id/role` | `users.changeRole` + `authorizeUserChange` | `{ role }` | 200 / 403 `self_change` / 409 `last_active_it` |
| `PATCH /api/users/:id/status` | `users.changeStatus` + `authorizeUserChange` | `{ status }` | 200 / 403 `self_change` / 409 `last_active_it` |
| `GET /api/clients` | `content.view` | `?page=1&limit=25` (limit 1–100, default 25) | 200 `{ items, total, page, limit }` |
| `GET /api/clients/:id` | `content.view` | — | 200 `Client` / 404 |

Order of checks inside a mutating handler: session (401) → permission (403) → parse body (400) → load target (404) → scope / invariants (409 then 403, see §7) → service write → 200. `managerId` on create must be null or reference an active user in `managerCandidates()` (400 `invalid_manager`). `password` is required on create (min 4 chars, plain text, never returned). Emails are compared case-insensitively and stored lower-case.

Role / status endpoints are separate from profile edit on purpose: one permission per handler, so the "where are decisions made" list stays short and a diff that touches role changes is visible by path.

## 10. Pages

| Route | Guard | Rendering |
|---|---|---|
| `/` | — | server redirect: no session → `/login`, else → `landingRoute` |
| `/login` | — | form posts to `/api/auth/login` via `api-client`; on success `router.push(landingRoute)`. If already logged in → redirect to landing |
| `/content` | `content.view` | server shell + client `ClientsTable` that fetches `/api/clients?page=N`; page in URL `?page=`; Prev / Next / "showing x–y of total" |
| `/content/client/[id]` | `content.view` | server component reads via `clientsService.getById` (same code path as the API), 404 via `notFound()` |
| `/content/me` | `content.view` | server component rendering the session user |
| `/manage-users` | `users.list` | server shell + client `UsersTable`: rows from `GET /api/users`; per-row inline edit of fullName/email (shown when `permissions` include `users.editProfile`), role `<select>` over `ROLES` and status toggle (shown when `users.changeRole` / `users.changeStatus` present); create form (`users.create`) with password field and manager dropdown from `GET /api/users/managers`. Every action calls the API and re-fetches; API errors are shown verbatim from the envelope |
| Forbidden | — | `Forbidden.tsx` rendered in place by `requirePagePermission` with the text "403 — your role (<role>) cannot access this page" and a link to the landing route. Never a redirect |

`Nav.tsx` receives `Me` from the layout and shows links only for permitted areas plus a Logout button. Hiding links is UX; it is not a check.

Client-side `api-client.ts`: `credentials: 'same-origin'`, parses the envelope, on 401 performs `window.location.assign('/login?expired=1')`. That is scenario 6: Olena's next page click returns 401 and she lands on `/login`.

## 11. Testing

Vitest, `environment: node`. Route handlers are imported and called with a `Request`; cookies are passed via the `cookie` header; the store is reset in `beforeEach`. No dev server in tests.

| Layer | File | Coverage |
|---|---|---|
| access | `unit/access/authorize.test.ts` | every cell of the role table, `visibleUsers` per role, rules 2–4 including: manager vs self / other manager / unassigned / another manager's report; last-IT via status and via role; self-change |
| services | `unit/users/*.test.ts`, `unit/clients/*.test.ts` | email uniqueness, manager validation, pagination math (first, middle, last, out-of-range page, limit clamp) |
| API | `api/*.test.ts` | status codes and envelopes per endpoint, 401 without cookie, 400 on bad body |
| scenarios | `api/scenarios.test.ts` | the six walkthroughs from the task verbatim, including "Olena's next request fails after deactivation" |

TDD order per module: test file first, then implementation. `npm test` must be green before every commit.

## 12. Agent instructions and docs

- `AGENTS.md`, `CLAUDE.md`: concise-communication rule, plans end with unresolved questions, npm, key commands, links to docs. Both identical except the title line.
- `docs/ARCHITECTURE.md`: layers table (route handler / service / repository over the store), layout, import boundaries, the access module, the `globalThis` store.
- `docs/CONVENTIONS.md`: zod schema = DTO, `z.enum(ROLES)`, error envelope, no role literals, `PublicUser` only leaves the server, no comments in code, explicit return types on exported server functions.
- `docs/TESTING.md`: what to test where, store reset, route handler invocation pattern.
- `docs/GUARDRAILS.md`: approval required for new dependencies, API shape changes, policy semantics changes; never: `any`, `@ts-ignore`, role literals outside `roles.ts`, permission logic in `src/ui` or client components, loading all clients to the browser, secrets in code.

Counter-intuitive facts that go in `AGENTS.md` verbatim: IT cannot view `/content`; roles are not ranked; a manager cannot edit themself; deactivation is checked on every request not at login; `proxy.ts` only checks cookie presence; 403 is a rendered page not a redirect; the store is on `globalThis` for dev HMR; passwords are plain text by requirement; the last-IT check runs before the self-change check and the order is load-bearing; "is a manager" is a policy property (`userScope`), not a role comparison; adding a role means `ROLES` + `ROLE_POLICY` + seed + README and nothing else.

## 13. Commit plan (history is graded)

1. `chore: scaffold next 16, strict ts, eslint+prettier, vitest`
2. `docs: agent files and architecture docs`
3. `feat: in-memory store with seeded users and generated clients`
4. `feat: access policy and authorize rules` (tests first in the same commit)
5. `feat: session auth — login, logout, me`
6. `feat: users api with scoped edit, role and status endpoints`
7. `feat: paginated clients api`
8. `feat: pages — login, content, client detail, me, manage-users, forbidden`
9. `test: six walkthrough scenarios`
10. `docs: README — run, accounts, auth choice, decision points, next steps`
11. `ci: lint, typecheck, test, build`
Then, only if the core passes: sorting/filtering with URL state, audit trail, error/loading states, Docker, each as its own commit.

## 14. Left to the builder

- Exact passwords, names of the four Anna reports beyond those listed, client name pools.
- Page size default (25 proposed), `limit` ceiling (100).
- Stale-cookie clearing mechanism (§8), as long as there is no loop.
- Component file granularity under `src/ui/components`.

## 15. Calls made after the builder check

- Rule order in `authorizeUserChange`: last-active-IT before self-change (§7). Required by scenario 5.
- `src/shared/` added for `ROLES`, `PERMISSIONS` and response types; `GET /api/users/managers` added so the UI never filters by role (§5, §9).
- `POST /api/users` requires `password` in the body (§9).
- Emails lower-cased and compared case-insensitively (§9).

## 16. Decisions from Viktor (2026-11-09)

Repo name and path: `~/Documents/projects/fullstack-test-task`.

`docs/superpowers/` (spec and plan) is committed so reviewers see the process (2026-11-09). No `GEMINI.md`. Every task is shown as exact code before it is written, and files are inspected on disk before every commit.
