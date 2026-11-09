# User Management & Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single Next.js 16 app where three non-hierarchical roles (IT, manager, user) manage users and browse a server-paginated client directory, with every permission rule enforced on the server in one module.

**Architecture:** Route handlers under `src/app/api/**` are thin: session → permission → parse → service → respond. All logic lives in `src/server/**` over an in-memory store cached on `globalThis`. `src/shared/**` holds const arrays and response types that both server and browser import. The permission matrix is a `Record<Role, RolePolicy>`; a fourth role is one append to `ROLES` and the compiler demands exactly one policy row.

**Tech Stack:** Next.js 16.4 App Router, TypeScript strict, zod, Vitest, ESLint flat config (eslint-config-next + typescript-eslint type-checked + prettier), npm, Node 24.

**Spec:** `docs/superpowers/specs/2026-11-09-user-management-design.md`

## Global Constraints

- `strict: true`, plus `noUnusedLocals` and `noUncheckedIndexedAccess`. `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/ban-ts-comment: error`.
- No code comments anywhere (`//`, `/* */`, JSDoc). Names and structure carry intent.
- Role string literals appear only in `src/shared/roles.ts`, `src/server/store/seed/users.seed.ts` and tests.
- Import boundaries (spec §5): `src/shared` imports nothing; `src/server` imports `src/server` + `src/shared`; route handlers import `src/server` only; `'use client'` components import `src/ui` + `src/shared` only; `src/ui` never imports `src/server`.
- Error envelope: `{ error: { code, message, details? } }`. Success bodies are the resource directly.
- Denial mapping: `forbidden` → 403, `conflict` → 409. In `authorizeUserChange`, `last_active_in_role` is evaluated before `self_change`.
- Cookie name `session`; `HttpOnly; Path=/; SameSite=Lax`, `Secure` when `NODE_ENV === 'production'`.
- Pagination: `page ≥ 1` default 1, `limit` 1–100 default 25, 1,200 generated clients, fixed PRNG seed.
- Commit after every task with the message given; no `Co-Authored-By` trailers. `npm test`, `npm run lint`, `npm run typecheck` green before every commit.
- Each implementer runs what they build and pastes observed output (test runner output, curl output) in their report.

## Review Focus

1. Malformed JSON or non-object body on any POST/PATCH must answer 400 `invalid_json` / `validation`, never 500. Test in Task 5 (`handle.ts`).
2. `PATCH /api/users/:id` with an unknown id answers 404 before the scope check. This is a deliberate choice for clear errors: a manager with the permission can tell a missing id (404) from an out-of-scope one (403). Test in Task 6.
3. Email uniqueness is case-insensitive on create and on profile edit, and editing a user to their own current email is not a conflict. Test in Task 6.
4. A manager demoted to `user` keeps their reports' `managerId`, but can no longer edit them because `userScope` becomes `null`. Test in Task 4.
5. `GET /api/clients?page=999` beyond the last page returns 200 with `items: []` and the real `total`; `page=0`, `page=abc`, `limit=101` return 400 `validation`. Test in Task 7.

---

### Task 1: Scaffold, tooling, repo hygiene

**Files:**

- Create: everything `create-next-app` emits, then rewrite `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.prettierrc`, `vitest.config.ts`, `.gitignore` additions
- Delete: `public/*.svg`, `src/app/favicon.ico` stays

**Interfaces:**

- Produces: `npm run dev|build|start|lint|format|typecheck|test|test:watch`; path alias `@/*` → `src/*` for both tsc and Vitest.

- [ ] **Step 1: Scaffold into a sibling directory and move it in (the repo folder already holds `docs/`)**

```bash
cd ~/Documents/projects
npx -y create-next-app@16.4.5 fullstack-test-task-scaffold --ts --app --src-dir --eslint --no-tailwind --no-agents-md --no-agent-feedback --disable-git --use-npm --import-alias "@/*"
rsync -a fullstack-test-task-scaffold/ fullstack-test-task/ && rm -rf fullstack-test-task-scaffold
cd fullstack-test-task && git init -b main
```

- [ ] **Step 2: Add dev dependencies**

```bash
npm i -D vitest prettier eslint-plugin-prettier eslint-config-prettier typescript-eslint
npm i zod
```

- [ ] **Step 3: Write `.prettierrc`** with `{ "singleQuote": true, "trailingComma": "all" }`.

- [ ] **Step 4: Rewrite `eslint.config.mjs`**

Compose, in order: `...nextVitals`, `...nextTs`, `...tseslint.configs.recommendedTypeChecked` scoped to `files: ['src/**/*.{ts,tsx}', 'test/**/*.ts']` with `languageOptions.parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }`, `eslintPluginPrettierRecommended`, a rules block `{ '@typescript-eslint/no-explicit-any': 'error', '@typescript-eslint/ban-ts-comment': 'error', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] }`, then `globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'coverage/**'])`. No comments in the file.

- [ ] **Step 5: Edit `tsconfig.json`**: add `"noUnusedLocals": true, "noUncheckedIndexedAccess": true`; keep `strict: true`, `paths: { "@/*": ["./src/*"] }`. Add `"test"` to `include`.

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    clearMocks: true,
  },
});
```

- [ ] **Step 7: Set `package.json` scripts**

`"dev": "next dev"`, `"build": "next build"`, `"start": "next start"`, `"lint": "eslint ."`, `"format": "prettier --write \"src/**/*.{ts,tsx,css}\" \"test/**/*.ts\""`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"test:watch": "vitest"`. Set `"name": "fullstack-test-task"`, `"private": true`.

- [ ] **Step 8: Strip scaffold boilerplate**

`next.config.ts` → `const nextConfig: NextConfig = {}; export default nextConfig;` with the type import. `src/app/layout.tsx` → html/body wrapper, `metadata = { title: 'User Management', description: 'Users directory and client content' }`, no Geist fonts. `src/app/page.tsx` → `export default function Home() { return <main>User Management</main>; }` (replaced in Task 8). `src/app/globals.css` → ~30 lines: system font stack, `max-width: 72rem` centered `main`, basic `table` borders and cell padding, `button`/`input`/`select` padding, `.error { color: #b00020 }`, `nav a { margin-right: 1rem }`. Delete `public/*.svg`. Remove any comment the scaffold left anywhere (`grep -rn "//\|/\*" src next.config.ts eslint.config.mjs vitest.config.ts` must only hit URLs inside strings, or nothing).

- [ ] **Step 9: Append to `.gitignore`**

```
.superpowers/
.idea/
.DS_Store
```

`docs/superpowers/` stays tracked (Viktor 2026-11-09: reviewers should see the spec and plan).

- [ ] **Step 10: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run --passWithNoTests && npm run build`
Expected: all four exit 0; build lists `/` route.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold next 16, strict ts, eslint+prettier, vitest"
```

---

### Task 2: Agent files and architecture docs

**Files:**

- Create: `AGENTS.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`, `docs/TESTING.md`, `docs/GUARDRAILS.md`

**Interfaces:**

- Produces: the rules later tasks must obey; Task 10 revisits these files for drift.

- [ ] **Step 1: Write `AGENTS.md`** (≈60 lines), sections in this order:
  1. One-line description: "Next.js 16 App Router app: three fixed roles, in-memory store, server-enforced permissions."
  2. Interaction rules: "Be extremely concise in all interactions and commit messages; sacrifice grammar for concision." "Plans end with a list of unresolved questions, extremely concise."
  3. Package manager: npm. Key commands block: `npm run dev`, `npm run build`, `npm test`, `npx vitest run test/path.test.ts`, `npm run lint`, `npm run typecheck`.
  4. Layout and boundaries: the import-boundary bullets from spec §5 verbatim, plus the one-sentence role of each `src/` folder.
  5. Hard rules an agent could plausibly violate (each one line): permission checks only in `src/server/access/` and `src/server/auth/`; route handlers contain no logic beyond parse → authorize → service → respond; clients list always paginated on the server, never slice in React or render 1,000 rows; role literals only in `src/shared/roles.ts` and the seed; UI hides controls based on `permissions` from `/api/auth/me` but that is UX not enforcement; no `any`, no `@ts-ignore`; no code comments.
  6. Counter-intuitive facts, verbatim list from spec §12.
  7. How to add a fourth role: append to `ROLES` in `src/shared/roles.ts`; fix the compile error in `ROLE_POLICY` (`src/server/access/policy.ts`); add seed accounts; list them in README; run `npm test`. Nothing else.
  8. Docs links: the four `docs/*.md`.
- [ ] **Step 2: Write `CLAUDE.md`** identical to `AGENTS.md` except the title line `# CLAUDE.md` and a first sentence "Guidance for Claude Code in this repository."
- [ ] **Step 3: (removed, no GEMINI.md per Viktor 2026-11-09)**
- [ ] **Step 4: Write `docs/ARCHITECTURE.md`**: layers table (Route handler | Service | Repository | Store, each with Owns / Never does); folder tree from spec §5; access module description (policy, authorize, denial kinds, evaluation order); session model; `globalThis` store and `resetStore()`.
- [ ] **Step 5: Write `docs/CONVENTIONS.md`**: zod schema is the DTO, `z.enum(ROLES)` / `z.enum(USER_STATUSES)`; error envelope and `HttpError`; `PublicUser` is the only user shape that leaves `src/server`; explicit return types on exported server functions; no comments; file naming `<domain>.service.ts` / `.repository.ts` / `.schema.ts`; client components live under `src/ui/` (`primitives/`, `layout/`, one folder per feature) and import only `src/ui` and `src/shared`.
- [ ] **Step 6: Write `docs/TESTING.md`**: table (access → unit, services → unit with `resetStore()` in `beforeEach`, route handlers → call exported `GET/POST/PATCH` with `new Request(...)` and `{ params: Promise.resolve({ id }) }`, pages → none); `loginAs(email)` helper returns a cookie header; test file first, then implementation; `clearMocks` is on.
- [ ] **Step 7: Write `docs/GUARDRAILS.md`**: Approval required: new dependency, API shape change, change to `ROLE_POLICY` semantics or denial codes. Never: `any` / `@ts-ignore`; role literal outside allowed files; permission logic in `src/ui` or any `'use client'` file; fetching all clients to the browser; secrets or real passwords beyond the seed; comments in code. When in doubt: additive over destructive; ask before refactoring across `src/server` domains.
- [ ] **Step 8: Verify** every file is free of framework or database terms that do not apply here: `grep -rniE "nest|drizzle|postgres|migration" AGENTS.md CLAUDE.md docs/*.md` → no output.
- [ ] **Step 9: Commit**

```bash
git add .gitignore AGENTS.md CLAUDE.md docs/
git commit -m "docs: agent files, architecture docs, spec and plan"
```

---

### Task 3: Shared contracts, in-memory store, seed

**Files:**

- Create: `src/shared/roles.ts`, `src/shared/permissions.ts`, `src/shared/api-types.ts`
- Create: `src/server/store/store.ts`, `src/server/store/types.ts`, `src/server/store/seed/clients.generator.ts`, `src/server/store/seed/users.seed.ts`
- Test: `test/unit/store/clients.generator.test.ts`, `test/unit/store/users.seed.test.ts`, `test/unit/store/store.test.ts`

**Interfaces:**

- Produces:

```ts
// src/shared/roles.ts
export const ROLES = ['IT', 'manager', 'user'] as const;
export type Role = (typeof ROLES)[number];
// src/shared/permissions.ts
export const PERMISSIONS = [
  'users.list',
  'users.create',
  'users.editProfile',
  'users.changeRole',
  'users.changeStatus',
  'content.view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];
// src/shared/api-types.ts
export const USER_STATUSES = ['active', 'deactivated'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  managerId: string | null;
  createdAt: string;
};
export const CLIENT_STATUSES = ['active', 'churned'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  country: string;
  status: ClientStatus;
  createdAt: string;
};
export type Me = {
  user: PublicUser;
  permissions: Permission[];
  landingRoute: string;
};
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
export type ErrorEnvelope = {
  error: { code: string; message: string; details?: unknown };
};
// src/server/store/store.ts
export type User = PublicUser & { password: string };
export type Session = { token: string; userId: string; createdAt: string };
export type Store = {
  users: Map<string, User>;
  clients: Client[];
  sessions: Map<string, Session>;
};
export function getStore(): Store;
export function resetStore(): Store;
// src/server/store/seed/clients.generator.ts
export const CLIENT_COUNT = 1200;
export const CLIENT_SEED = 'user-management-2026';
export function generateClients(count?: number, seed?: string): Client[];
// src/server/store/seed/users.seed.ts
export function seedUsers(): User[];
```

- [ ] **Step 1: Write the failing generator test** `test/unit/store/clients.generator.test.ts`

```ts
describe('generateClients', () => {
  it('returns CLIENT_COUNT clients with unique ids', ...)        // length 1200, new Set(ids).size === 1200
  it('is deterministic for the same seed', ...)                    // JSON.stringify(generateClients()) === JSON.stringify(generateClients())
  it('churns a meaningful share', ...)                              // churned / total between 0.2 and 0.4
  it('is sorted by createdAt desc then id asc', ...)                // every adjacent pair satisfies the order
  it('spreads createdAt over the last three years', ...)            // min createdAt > now - 3y - 1d; max <= now
});
```

- [ ] **Step 2: Run it**: `npx vitest run test/unit/store/clients.generator.test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement `generateClients`** with `seedrandom` (dependency approved by Viktor 2026-11-09). Ids `c-0001`…`c-1200` before sorting. Name pools: ≥20 first names, ≥20 last names, ≥15 company suffixes/words, ≥12 countries, all inline consts. Email `${first}.${last}@${companySlug}.example`. `createdAt` = ISO string of `now - rnd * 3 years` using `now` anchored to the start of the current UTC day so two calls are identical. Status churned when `rnd() < 0.3`.
- [ ] **Step 4: Run it** → PASS.
- [ ] **Step 5: Write the failing seed test** `test/unit/store/users.seed.test.ts`

```ts
describe('seedUsers', () => {
  it('has two active IT accounts', ...)
  it('gives Anna exactly four active direct reports', ...)         // managerId === 'u-anna' → 4
  it('has a manager with no reports (Oksana)', ...)
  it('has a deactivated manager (Maksym) with an active report (Dmytro)', ...)
  it('has an already deactivated user (Yurii) and an unassigned active user (Nazar)', ...)
  it('uses unique lower-case emails', ...)
});
```

- [ ] **Step 6: Run it** → FAIL.
- [ ] **Step 7: Implement `seedUsers`** with fixed ids `u-<name>`, emails `<name>@example.com`, passwords `<name>123`, roster from spec §6, `createdAt` fixed ISO strings in 2024–2025.
- [ ] **Step 8: Run it** → PASS.
- [ ] **Step 9: Write the failing store test** `test/unit/store/store.test.ts`

```ts
it('getStore returns the same instance twice', ...)
it('resetStore returns a fresh seeded store and getStore then returns it', ...)   // mutate users, reset, size restored, sessions empty
it('caches the store on globalThis', ...)                                           // (globalThis as Record<string, unknown>)['__userManagementStore'] === getStore()
```

- [ ] **Step 10: Run it** → FAIL.
- [ ] **Step 11: Implement `store.ts`**: `const KEY = '__userManagementStore'`; typed accessor over `globalThis`; `buildStore()` seeds users into a `Map` keyed by id and clients from `generateClients()`; `getStore()` builds on first call; `resetStore()` always rebuilds and stores.
- [ ] **Step 12: Run all** `npm test && npm run typecheck && npm run lint` → PASS.
- [ ] **Step 13: Commit**

```bash
git add src/shared src/server/store test/unit/store
git commit -m "feat: in-memory store with seeded users and generated clients"
```

---

### Task 4: Access policy and authorize rules

**Files:**

- Create: `src/server/access/policy.ts`, `src/server/access/authorize.ts`, `src/server/access/user-change.ts`
- Test: `test/unit/access/policy.test.ts`, `test/unit/access/authorize.test.ts`, `test/unit/access/user-change.test.ts`, `test/helpers/users.ts`

**Interfaces:**

- Consumes: `Role`, `Permission`, `PublicUser`, `UserStatus` from Task 3.
- Produces:

```ts
// src/server/access/policy.ts
export type UserScope = 'all' | 'reports';
export type RolePolicy = {
  permissions: ReadonlySet<Permission>;
  userScope: UserScope | null;
  landingRoute: string;
};
export const ROLE_POLICY: Record<Role, RolePolicy>;
export function policyFor(role: Role): RolePolicy;
export function permissionsOf(role: Role): Permission[];
export function canManageReports(role: Role): boolean; // userScope === 'reports'
// src/server/access/authorize.ts
export function can(actor: PublicUser, permission: Permission): boolean;
export function canOnUser(
  actor: PublicUser,
  permission: Permission,
  target: PublicUser,
): boolean;
export function visibleUsers(
  actor: PublicUser,
  all: PublicUser[],
): PublicUser[];
// src/server/access/user-change.ts (split from authorize.ts, Viktor 2026-11-09)
export type Denial = {
  kind: 'forbidden' | 'conflict';
  code: string;
  message: string;
};
export type Decision = { ok: true } | { ok: false; denial: Denial };
export type UserChange = { role: Role } | { status: UserStatus };
export const DENIALS: {
  outOfScope: Denial;
  lastActiveInRole: Denial;
  selfChange: Denial;
};
export function authorizeUserChange(
  actor: PublicUser,
  target: PublicUser,
  change: UserChange,
  users: Iterable<PublicUser>,
): Decision;
// test/helpers/users.ts
export function user(
  overrides: Partial<PublicUser> & { role: Role },
): PublicUser; // fills id, email, status 'active', managerId null
```

- [ ] **Step 1: Write the failing policy test** `test/unit/access/policy.test.ts`: a table test over the spec §7 matrix: for each role × permission assert `policyFor(role).permissions.has(p)` equals the expected boolean (IT: all five `users.*`, no `content.view`; manager: `users.list`, `users.editProfile`, `content.view`; user: `content.view` only). Assert `landingRoute` IT → `/manage-users`, others → `/content`. Assert `canManageReports` true only for `manager`. Assert `ROLES.every((r) => r in ROLE_POLICY)`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement `policy.ts`** exactly as spec §7, with a local `set(...perms: Permission[]): ReadonlySet<Permission>` helper.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Write the failing authorize test** `test/unit/access/authorize.test.ts` using `user()` helper. Fixtures: `ivan` (IT), `petro` (IT), `anna` (manager), `oksana` (manager), `olena` (user, managerId anna), `dmytro` (user, managerId `u-maksym`), `nazar` (user, managerId null).

```ts
describe('can', () => {
  /* one it per matrix row sample: IT cannot content.view; user cannot users.list; manager can users.editProfile */
});
describe('canOnUser editProfile', () => {
  it('IT on anyone → true');
  it('manager on own report → true'); // anna, olena
  it('manager on self → false');
  it('manager on other manager → false'); // anna, oksana
  it("manager on another manager's report → false"); // anna, dmytro
  it('manager on unassigned user → false'); // anna, nazar
  it('user on their own report-looking target → false'); // user-role actor with a target whose managerId === actor.id → false (Review Focus 4)
  it('false when actor lacks the permission regardless of target'); // user actor, 'users.editProfile'
});
describe('visibleUsers', () => {
  it('IT sees all');
  it('manager sees only direct reports');
  it('user sees none');
});
describe('authorizeUserChange', () => {
  it('last active IT deactivating self → conflict last_active_in_role'); // users = [ivan, anna]
  it('last active IT demoting self to manager → conflict last_active_in_role');
  it('IT deactivating self with another active IT → forbidden self_change'); // users = [ivan, petro]
  it('IT demoting self with another active IT → forbidden self_change');
  it('IT deactivating the other IT → ok'); // users = [ivan, petro]
  it('IT re-activating a deactivated IT → ok');
  it('IT changing own role to IT (no-op) → ok');
  it('IT deactivating a manager → ok');
  it('IT changing a manager to user → ok');
  it('order: last_active_in_role wins over self_change when both apply'); // ivan alone, deactivate self → code last_active_in_role
});
```

- [ ] **Step 6: Run** → FAIL.
- [ ] **Step 7: Implement `authorize.ts` (lookups) and `user-change.ts` (invariants)**. Rule 4 without a role literal: the invariant is "never remove the last active holder of a role with `keepOneActive`" (policy column, decided 2026-11-09). Implement `removesLastActiveOfProtectedRole(target, change, users): boolean` = target is active, `policyFor(target.role).keepOneActive`, the change is `status: 'deactivated'` or a `role` different from `target.role`, and no _other_ active user has `target.role`. For today's roles this is exactly "last active IT"; a fourth admin-like role is protected automatically. `authorizeUserChange` evaluates this first (→ `conflict`, `last_active_in_role`), then `target.id === actor.id` with a deactivating or role-changing change (→ `forbidden`, `self_change`), else `{ ok: true }`.
- [ ] **Step 8: Run** → PASS. Then `npm test && npm run lint && npm run typecheck`.
- [ ] **Step 9: Commit**

```bash
git add src/server/access test/unit/access test/helpers
git commit -m "feat: access policy and authorize rules"
```

---

### Task 5: HTTP plumbing and session auth

**Files:**

- Create: `src/server/http/errors.ts`, `src/server/http/respond.ts`, `src/server/http/body.ts`, `src/server/http/handle.ts`
- Create: `src/server/auth/session-cookie.ts`, `src/server/auth/sessions.ts`, `src/server/auth/credentials.ts`, `src/server/auth/me.ts`, `src/server/auth/require-session.ts`, `src/server/auth/require-permission.ts`
- Create: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`
- Test: `test/unit/http/handle.test.ts`, `test/api/auth.test.ts`, `test/helpers/api.ts`

**Interfaces:**

- Consumes: store, `seedUsers`, `can`, `permissionsOf`, `policyFor`.
- Produces:

```ts
// errors.ts
export class HttpError extends Error { constructor(readonly status: number, readonly code: string, message: string, readonly details?: unknown); }
export function unauthenticated(): HttpError;                       // 401 'unauthenticated'
export function forbidden(code?: string, message?: string): HttpError; // 403, default code 'forbidden'
export function notFound(what: string): HttpError;                  // 404 'not_found'
export function badRequest(code: string, message: string, details?: unknown): HttpError;
export function conflict(code: string, message: string): HttpError;
export function fromDenial(denial: Denial): HttpError;              // forbidden→403, conflict→409, code = denial.code
// respond.ts
export function json(body: unknown, status?: number, headers?: HeadersInit): Response;
export function noContent(headers?: HeadersInit): Response;
export function errorResponse(error: HttpError): Response;         // ErrorEnvelope body
// body.ts
export function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T>;   // invalid JSON → badRequest('invalid_json'); ZodError → badRequest('validation', 'Invalid request body', flatten)
export function parseQuery<T>(request: Request, schema: ZodType<T>): T;           // from URL searchParams
// handle.ts
export type HandlerContext<P = Record<string, never>> = { params: Promise<P> };   // named to avoid Next's generated global RouteContext
export function handle<P>(fn: (request: Request, ctx: HandlerContext<P>) => Promise<Response> | Response): (request: Request, ctx: HandlerContext<P>) => Promise<Response>;  // HttpError → errorResponse; else 500 'internal'
// session-cookie.ts
export const SESSION_COOKIE = 'session';
export function readSessionToken(cookieHeader: string | null): string | null;
export function sessionCookie(token: string): string;
export function clearedSessionCookie(): string;                     // Max-Age=0
// sessions.ts
export function createSession(userId: string): Session;
export function findSession(token: string): Session | undefined;
export function deleteSession(token: string): void;
// credentials.ts
export function authenticate(email: string, password: string): PublicUser | null;   // active users only, email case-insensitive
// me.ts
export function toMe(user: PublicUser): Me;
// require-session.ts
export function requireSession(request: Request): PublicUser;      // throws unauthenticated(); deletes stale session
// require-permission.ts
export function requirePermission(request: Request, permission: Permission): PublicUser;  // requireSession then can() else forbidden()
// test/helpers/api.ts
export function req(method: string, path: string, init?: { body?: unknown; cookie?: string }): Request;   // base http://localhost
export async function loginAs(email: string): Promise<string>;     // calls login route with seed password `<name>123`, returns cookie header "session=<token>"
export function ctx<P>(params: P): HandlerContext<P>;
```

- [ ] **Step 1: Write the failing handle test** `test/unit/http/handle.test.ts`

```ts
it('maps HttpError to its status and envelope'); // forbidden('out_of_scope') → 403 { error: { code: 'out_of_scope' } }
it('maps unknown errors to 500 internal');
it('parseBody rejects invalid JSON with 400 invalid_json'); // body 'not json'
it('parseBody rejects schema violations with 400 validation and details');
it('parseBody rejects a non-object body with 400 validation'); // body '"str"'
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement `errors.ts`, `respond.ts`, `body.ts`, `handle.ts`**. `handle` logs the unknown error with `console.error` before returning 500.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Write the failing auth API test** `test/api/auth.test.ts` (imports the three route modules; `resetStore()` in `beforeEach`)

```ts
describe('POST /api/auth/login', () => {
  it('200 with Me and Set-Cookie for valid credentials'); // ivan@example.com / ivan123; body.user.email, body.permissions contains 'users.create', landingRoute '/manage-users'; Set-Cookie matches /^session=[^;]+; Path=\/; HttpOnly; SameSite=Lax$/
  it('is case-insensitive on email'); // IVAN@Example.com
  it('401 invalid_credentials for wrong password');
  it('401 invalid_credentials for deactivated user'); // yurii@example.com / yurii123
  it('400 validation for missing fields');
});
describe('GET /api/auth/me', () => {
  it('401 without cookie');
  it('401 with unknown token');
  it('200 Me with valid cookie');
  it('401 once the user is deactivated, and the session is gone'); // mutate getStore().users.get('u-olena').status, then me → 401; findSession(token) undefined
});
describe('POST /api/auth/logout', () => {
  it('204 and clears the cookie; me afterwards is 401');
});
```

- [ ] **Step 6: Run** → FAIL.
- [ ] **Step 7: Implement auth modules and routes**. Login route: `parseBody` with `z.object({ email: z.string().email(), password: z.string().min(1) })`; `authenticate` null → `new HttpError(401, 'invalid_credentials', 'Invalid email or password')`; respond `json(toMe(user), 200, { 'Set-Cookie': sessionCookie(token) })`. Logout: `requireSession` not required (idempotent); delete session if token present; `noContent({ 'Set-Cookie': clearedSessionCookie() })`. Me: `json(toMe(requireSession(request)))`. `sessionCookie` appends `; Secure` when `process.env.NODE_ENV === 'production'`.
- [ ] **Step 8: Run** → PASS; `npm test && npm run lint && npm run typecheck` green.
- [ ] **Step 9: Smoke with curl** against `npm run dev` (port 3000):

```bash
curl -si -X POST localhost:3000/api/auth/login -H 'content-type: application/json' -d '{"email":"anna@example.com","password":"anna123"}' | tee /dev/stderr | grep -i '^set-cookie'
curl -si localhost:3000/api/auth/me   # expect 401 envelope
```

Paste both outputs in the report. Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add src/server/http src/server/auth src/app/api/auth test/unit/http test/api/auth.test.ts test/helpers/api.ts
git commit -m "feat: session auth - login, logout, me"
```

---

### Task 6: Users API

**Files:**

- Create: `src/server/users/users.schema.ts`, `src/server/users/users.repository.ts`, `src/server/users/users.service.ts`
- Create: `src/app/api/users/route.ts`, `src/app/api/users/managers/route.ts`, `src/app/api/users/[id]/route.ts`, `src/app/api/users/[id]/role/route.ts`, `src/app/api/users/[id]/status/route.ts`
- Test: `test/unit/users/users.service.test.ts`, `test/api/users.test.ts`

**Interfaces:**

- Consumes: Tasks 3–5.
- Produces:

```ts
// users.schema.ts
export const createUserSchema = z.object({ fullName: z.string().trim().min(1).max(120), email: z.string().trim().toLowerCase().email(), password: z.string().min(4).max(72), role: z.enum(ROLES), managerId: z.string().min(1).nullable().optional() });
export const updateProfileSchema = z.object({ fullName: ..., email: ... }).partial().refine(at least one key);
export const changeRoleSchema = z.object({ role: z.enum(ROLES) });
export const changeStatusSchema = z.object({ status: z.enum(USER_STATUSES) });
export type CreateUserInput = z.infer<typeof createUserSchema>; export type UpdateProfileInput = ...;
// users.repository.ts
export function toPublic(user: User): PublicUser;
export function listUsers(): PublicUser[];
export function findUser(id: string): PublicUser | undefined;
export function findUserByEmail(email: string): PublicUser | undefined;   // lower-cased compare
export function insertUser(user: User): PublicUser;
export function updateUser(id: string, patch: Partial<Omit<User, 'id' | 'createdAt'>>): PublicUser;  // throws notFound
// users.service.ts
export function listVisibleUsers(actor: PublicUser): PublicUser[];
export function managerCandidates(): PublicUser[];                        // active && canManageReports(role)
export function createUser(input: CreateUserInput): PublicUser;           // 409 email_taken, 400 invalid_manager
export function updateProfile(actor: PublicUser, id: string, input: UpdateProfileInput): PublicUser;  // 404, 403 out_of_scope via canOnUser, 409 email_taken
export function changeRole(actor: PublicUser, id: string, role: Role): PublicUser;        // 404, then fromDenial(authorizeUserChange)
export function changeStatus(actor: PublicUser, id: string, status: UserStatus): PublicUser;
```

- [ ] **Step 1: Write the failing service test** `test/unit/users/users.service.test.ts` (`resetStore()` in `beforeEach`; actors from `getStore()`)

```ts
describe('createUser', () => {
  it('creates an active user with managerId null when omitted');
  it('409 email_taken for an existing email in different case'); // 'ANNA@example.com'
  it('400 invalid_manager when managerId is not a manager candidate'); // 'u-olena', 'u-maksym' (deactivated manager), 'nope'
  it('accepts an active manager as managerId'); // 'u-oksana'
});
describe('managerCandidates', () => {
  it('returns Anna and Oksana only');
});
describe('updateProfile', () => {
  it('404 for unknown id before any scope check'); // anna, 'missing' → 404 not 403 (Review Focus 2)
  it('403 out_of_scope for a manager editing a non-report'); // anna → dmytro
  it('updates own report'); // anna → olena fullName
  it("409 email_taken when changing to another user's email");
  it('allows setting the same email the user already has'); // Review Focus 3
});
describe('changeStatus / changeRole', () => {
  it('deactivating a user succeeds and the result has status deactivated');
  it('propagates last_active_in_role as 409'); // deactivate petro, then ivan deactivates ivan
  it('propagates self_change as 403');
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement schema, repository, service** per interfaces. `createUser` id = `randomUUID()`, `createdAt = new Date().toISOString()`, status `'active'`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Write the failing API test** `test/api/users.test.ts` using `loginAs`

```ts
it('GET /api/users 401 without cookie');
it('GET /api/users as Anna lists exactly her four reports');
it('GET /api/users as Ivan lists all users and never includes password'); // JSON.stringify(body) does not contain 'ivan123'
it('GET /api/users as Olena → 403');
it('GET /api/users/managers as Ivan → Anna and Oksana; as Anna → 403');
it(
  'POST /api/users as Anna → 403; as Ivan with valid body → 201; with bad email → 400 validation',
);
it('PATCH /api/users/u-dmytro as Anna → 403 out_of_scope');
it('PATCH /api/users/u-olena as Anna → 200 with new fullName');
it('PATCH /api/users/u-anna/role as Anna → 403 forbidden'); // rule 1, not self_change: permission check comes first
it(
  'PATCH /api/users/u-ivan/status as Ivan → 403 self_change; after deactivating u-petro → 409 last_active_in_role',
);
it(
  'PATCH /api/users/u-olena/status {status:"deactivated"} as Ivan → 200, then Olena\'s /api/auth/me → 401',
);
```

- [ ] **Step 6: Run** → FAIL.
- [ ] **Step 7: Implement the five route files**, each handler ≤ 8 lines: `const actor = requirePermission(request, '<perm>')`, `const body = await parseBody(...)`, `const { id } = await ctx.params`, `return json(service(...), status)`.
- [ ] **Step 8: Run** → PASS; `npm test && npm run lint && npm run typecheck`.
- [ ] **Step 9: Commit**

```bash
git add src/server/users src/app/api/users test/unit/users test/api/users.test.ts
git commit -m "feat: users api with scoped edit, role and status endpoints"
```

---

### Task 7: Paginated clients API

**Files:**

- Create: `src/server/clients/clients.schema.ts`, `src/server/clients/clients.repository.ts`, `src/server/clients/clients.service.ts`
- Create: `src/app/api/clients/route.ts`, `src/app/api/clients/[id]/route.ts`
- Test: `test/unit/clients/clients.service.test.ts`, `test/api/clients.test.ts`

**Interfaces:**

```ts
// clients.schema.ts
export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
// clients.repository.ts
export function pageClients(page: number, limit: number): Paginated<Client>; // slice over the pre-sorted array
export function findClient(id: string): Client | undefined;
// clients.service.ts
export function listClients(query: ListClientsQuery): Paginated<Client>;
export function getClient(id: string): Client; // notFound('client')
```

- [ ] **Step 1: Write the failing service test**

```ts
it('first page returns 25 items and total 1200');
it('page 48 returns the last 25; page 49 returns [] with total 1200'); // Review Focus 5
it('limit 100 page 12 returns 100 items; page 13 returns []');
it("items are in the store's order (createdAt desc)");
it('getClient throws 404 for unknown id');
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Write the failing API test**

```ts
it('GET /api/clients 401 without cookie');
it('GET /api/clients as Ivan → 403'); // IT cannot view content
it(
  'GET /api/clients as Anna → 200, items.length 25, total 1200, page 1, limit 25',
);
it(
  'GET /api/clients?page=2&limit=10 → page 2 limit 10, items differ from page 1',
);
it(
  'GET /api/clients?page=0 → 400 validation; ?page=abc → 400; ?limit=101 → 400',
);
it('GET /api/clients?page=999 → 200 items [] total 1200');
it('GET /api/clients/c-0001 as Olena → 200; /api/clients/nope → 404');
```

- [ ] **Step 6: Run** → FAIL. **Step 7: Implement routes** (`parseQuery`, `requirePermission(request, 'content.view')`). **Step 8: Run** → PASS; lint, typecheck.
- [ ] **Step 9: Commit**

```bash
git add src/server/clients src/app/api/clients test/unit/clients test/api/clients.test.ts
git commit -m "feat: paginated clients api"
```

---

### Task 8: App shell — proxy, page auth, login, root redirect, forbidden

**Files:**

- Create: `src/proxy.ts`, `src/server/page-auth.ts`, `src/ui/api-client.ts`, `src/ui/layout/Nav.tsx`, `src/ui/layout/SidebarUser.tsx`, `src/ui/layout/Forbidden.tsx`, `src/ui/primitives/ErrorMessage.tsx`, `src/ui/auth/LoginForm.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/app/login/page.tsx`

**Interfaces:**

```ts
// src/server/page-auth.ts (server only; uses cookies() from next/headers)
export async function currentUser(): Promise<PublicUser | null>;             // null when no/invalid/inactive session
export async function requirePageSession(): Promise<PublicUser>;             // redirect('/login?expired=1') when null
export async function pageAccess(permission: Permission): Promise<{ me: Me; allowed: boolean }>;   // requirePageSession + can
// src/ui/api-client.ts ('use client' safe)
export class ApiError extends Error { constructor(readonly status: number, readonly code: string, message: string) }
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T>;   // credentials same-origin, JSON content-type when body, 204 → undefined as T, non-2xx → ApiError from envelope; on 401 window.location.assign('/login?expired=1') then throw
// components
Nav({ me }: { me: Me | null })                 // links: /content, /content/me when 'content.view'; /manage-users when 'users.list'; Logout button → POST /api/auth/logout then location '/login'
Forbidden({ me }: { me: Me })                   // "403 — your role (<role>) cannot access this page" + link to me.landingRoute
ErrorMessage({ error }: { error: string | null })
LoginForm({ clearStale }: { clearStale: boolean })   // on mount if clearStale → apiFetch('/api/auth/logout', { method: 'POST' }); submit → apiFetch<Me>('/api/auth/login') → router.push(me.landingRoute); shows ErrorMessage
```

- [ ] **Step 1: Write `src/proxy.ts`**: `export function proxy(request: NextRequest)`: if no `session` cookie → `NextResponse.redirect(new URL('/login', request.url))`; else `NextResponse.next()`. `config.matcher = ['/((?!api|login|_next/static|_next/image|favicon.ico).*)']`.
- [ ] **Step 2: Write `page-auth.ts`** reusing `findSession`, `findUser`, `toMe`, `can`.
- [ ] **Step 3: Write `api-client.ts`** and the four components.
- [ ] **Step 4: Rewrite `layout.tsx`**: `const user = await currentUser(); <Nav me={user ? toMe(user) : null} />` then `<main>{children}</main>`.
- [ ] **Step 5: Rewrite `src/app/page.tsx`**: `const user = await currentUser(); redirect(user ? policyFor(user.role).landingRoute : '/login')`.
- [ ] **Step 6: Write `src/app/login/page.tsx`**: `searchParams: Promise<{ expired?: string }>`; if `currentUser()` → redirect to landing; else render `<h1>Login</h1><LoginForm clearStale={expired === '1'} />` plus a static list of seed logins (name, email, password) so reviewers can log in without the README.
- [ ] **Step 7: Verify** `npm run typecheck && npm run lint && npm run build` → PASS. Then with `npm run dev`:

```bash
curl -si localhost:3000/content | head -5                      # 307 Location: /login
curl -si localhost:3000/login | grep -o '<h1>[^<]*</h1>'      # <h1>Login</h1>
C=$(curl -si -X POST localhost:3000/api/auth/login -H 'content-type: application/json' -d '{"email":"ivan@example.com","password":"ivan123"}' | grep -i '^set-cookie' | sed 's/^[Ss]et-[Cc]ookie: //; s/;.*//')
curl -si -H "cookie: $C" localhost:3000/ | head -3             # 307 Location: /manage-users
curl -si -H "cookie: session=stale" localhost:3000/ | head -3  # 307 Location: /login
```

Paste outputs. Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add src/proxy.ts src/server/page-auth.ts src/ui src/app/layout.tsx src/app/page.tsx src/app/login
git commit -m "feat: app shell - proxy, page auth, login, forbidden"
```

---

### Task 9: Content pages

**Files:**

- Create: `src/app/content/page.tsx`, `src/app/content/client/[id]/page.tsx`, `src/app/content/me/page.tsx`, `src/ui/clients/ClientsTable.tsx`, `src/ui/clients/ClientRow.tsx`, `src/ui/hooks/useApiQuery.ts`, `src/ui/format.ts`, `src/ui/primitives/{Badge,DetailsList,PageHeader,Pagination,TableSkeleton}.tsx`

**Interfaces:**

```ts
ClientsTable({ initialPage }: { initialPage: number })   // 'use client'; reads ?page via useSearchParams, fetches apiFetch<Paginated<Client>>(`/api/clients?page=${page}&limit=25`); rows link to /content/client/<id>; renders Pagination
Pagination({ page, limit, total, onChange }: { page: number; limit: number; total: number; onChange: (page: number) => void })   // "Showing a–b of total", Prev/Next disabled at bounds; onChange pushes ?page= via router
```

- [ ] **Step 1: `content/page.tsx`**: `const { me, allowed } = await pageAccess('content.view'); if (!allowed) return <Forbidden me={me} />;` then `<h1>Clients</h1><ClientsTable initialPage={Number(page ?? 1)} />`.
- [ ] **Step 2: `content/client/[id]/page.tsx`**: same guard; `getClient(id)` inside `try` → `notFound()` on `HttpError` 404; render a definition list of all client fields and a link back to `/content`.
- [ ] **Step 3: `content/me/page.tsx`**: same guard; render `me.user` fields and `me.permissions` list.
- [ ] **Step 4: Components** `ClientsTable`, `Pagination`.
- [ ] **Step 5: Verify** `npm run typecheck && npm run lint && npm run build`; with the dev server running, obtain `$ANNA` and `$IVAN` cookie values with the login curl from Task 8 Step 7 (`anna@example.com` / `anna123`, `ivan@example.com` / `ivan123`), then:

```bash
curl -s -H "cookie: $ANNA" localhost:3000/content | grep -c '<table'           # ≥1 (shell renders; rows come from the API)
curl -s -H "cookie: $IVAN" localhost:3000/content | grep -o '403[^<]*'          # 403 — your role (IT) cannot access this page
curl -s -H "cookie: $ANNA" localhost:3000/api/clients?page=2 | python3 -c 'import json,sys; d=json.load(sys.stdin); print(len(d["items"]), d["total"], d["page"])'   # 25 1200 2
curl -s -H "cookie: $ANNA" localhost:3000/content/client/c-0001 | grep -c 'c-0001'   # ≥1
curl -si -H "cookie: $ANNA" localhost:3000/content/client/nope | head -1              # 404
```

Paste outputs. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/app/content src/ui docs AGENTS.md
git commit -m "feat: content pages - clients table, client detail, me"
```

---

### Task 10: Manage users page

**Files:**

- Create: `src/app/manage-users/page.tsx`, `src/ui/users/{UsersTable,UserRow,ProfileEditor,RoleSelect,StatusButton,CreateUserForm}.tsx`, `src/ui/users/{abilities,users-api,useUserMutation}.ts`, `src/ui/query-client.tsx`, `src/ui/query-keys.ts`, `src/ui/primitives/Field.tsx`, `src/shared/schemas/{users,auth}.ts`

**Interfaces:**

```ts
UsersTable({ me }: { me: Me })            // 'use client'; loads GET /api/users; renders UserRow per user; shows CreateUserForm when me.permissions includes 'users.create'; refetches after any change
UserRow({ user, me, onChanged }: { user: PublicUser; me: Me; onChanged: () => void })
   // inline fullName/email edit when 'users.editProfile'; role <select> over ROLES when 'users.changeRole'; Activate/Deactivate button when 'users.changeStatus'; each action → apiFetch PATCH, errors shown via ErrorMessage with the envelope message
CreateUserForm({ onCreated }: { onCreated: () => void })
   // fields fullName, email, password, role <select> over ROLES, manager <select> from GET /api/users/managers (plus "none"); POST /api/users
```

- [ ] **Step 1: `manage-users/page.tsx`**: `pageAccess('users.list')` → `Forbidden` or `<h1>Manage users</h1><UsersTable me={me} />`.
- [ ] **Step 2: Components.** Only `permissions` from `me` decide what renders; `ROLES` is used solely for `<option>` values; no comparison against role values anywhere in `src/ui`. Verify: `grep -rn "'IT'\|'manager'\|'user'" src/ui src/app` → no output.
- [ ] **Step 3: Verify** `npm run typecheck && npm run lint && npm run build`; dev server, cookies obtained as in Task 8 Step 7 (`$OLENA` from `olena@example.com` / `olena123`):

```bash
curl -s -H "cookie: $ANNA" localhost:3000/manage-users | grep -c 'Manage users'    # 1
curl -s -H "cookie: $OLENA" localhost:3000/manage-users | grep -o '403[^<]*'         # 403 — your role (user) cannot access this page
curl -s -H "cookie: $ANNA" localhost:3000/api/users | python3 -c 'import json,sys; print([u["fullName"] for u in json.load(sys.stdin)["items"]])'   # four names
curl -si -X PATCH -H "cookie: $ANNA" -H 'content-type: application/json' -d '{"role":"IT"}' localhost:3000/api/users/u-anna/role | head -1   # 403
```

Paste outputs. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/manage-users src/ui/users
git commit -m "feat: manage users page with scoped editing"
```

---

### Task 11: Walkthrough scenarios test

**Files:**

- Test: `test/api/scenarios.test.ts`

- [ ] **Step 1: Write the six scenarios from the task, one `it` each, API level, using `loginAs` and the route modules**

```ts
it('1. Anna sees only her four reports; cannot edit Dmytro via API'); // GET users → 4 ids; PATCH u-dmytro → 403 out_of_scope
it('2. Anna cannot give herself IT'); // PATCH u-anna/role → 403 forbidden
it('3. Anna pages clients and opens one; each page is ≤ 25 items'); // page 1, page 2 differ; GET client by first id → 200
it('4. Ivan lands on /manage-users and is refused on content'); // login landingRoute '/manage-users'; GET clients → 403
it(
  '5. Ivan: self deactivate 403 self_change; deactivate Petro 200; self again 409 last_active_in_role',
);
it('6. Olena browsing, Ivan deactivates her, her next request is 401'); // GET clients 200; PATCH status by Ivan; GET clients with Olena cookie → 401
```

- [ ] **Step 2: Run** `npx vitest run test/api/scenarios.test.ts` → PASS on first run (everything exists). If any fails, that is a real defect: fix the owning module, not the test.
- [ ] **Step 3: Commit**

```bash
git add test/api/scenarios.test.ts
git commit -m "test: six walkthrough scenarios"
```

---

### Task 12: README

**Files:**

- Create: `README.md`
- Modify: `AGENTS.md`, `CLAUDE.md`, `docs/*.md` only if a file path or rule drifted during Tasks 3–11

- [ ] **Step 1: Write `README.md`** with exactly these sections: How to run (`npm i`, `npm run dev`, `npm test`, `npm run build && npm start`); Seeded accounts (table: name, email, password, role, status, manager, from `users.seed.ts`); Auth approach (session cookie + in-memory session map; why not JWT; how rule 5 works: user reloaded per request in `require-session.ts`, deactivated → 401 and session deleted); Where permission decisions are made (the five paths from spec §7, one line each); API reference (the table from spec §9); What I would do with another four hours (tests for UI flows with Playwright, sorting/filtering with URL state, audit trail, optimistic UI with error toasts, Docker, rate-limit login).
- [ ] **Step 2: Drift check**: `grep -rn "src/" AGENTS.md docs/*.md | sed 's/.*\(src\/[A-Za-z0-9_./-]*\).*/\1/' | sort -u | while read p; do [ -e "$p" ] || echo "missing $p"; done` → no output. Fix any mismatch.
- [ ] **Step 3: Commit**

```bash
git add README.md AGENTS.md CLAUDE.md docs/ARCHITECTURE.md docs/CONVENTIONS.md docs/TESTING.md docs/GUARDRAILS.md
git commit -m "docs: README - run, accounts, auth choice, decision points, next steps"
```

---

### Task 13: CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**: on `push` and `pull_request`; `concurrency` group per ref with cancel-in-progress; one job `check` on `ubuntu-latest`, `actions/checkout@v4`, `actions/setup-node@v4` with `node-version: 24` and `cache: npm`; steps `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- [ ] **Step 2: Verify locally** the same five commands in order exit 0 (`npm ci` included).
- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint, typecheck, test, build"
```

---

## Bonus (only after Tasks 1–13 are green and the scenarios pass)

Each is its own task and commit, in this order; stop when time is up.

1. **Sorting and filtering on clients** — `listClientsQuerySchema` gains `sort: z.enum(['createdAt','name','company','country']).default('createdAt')`, `order: z.enum(['asc','desc']).default('desc')`, `status: z.enum(CLIENT_STATUSES).optional()`, `q: z.string().trim().max(80).optional()`; repository filters then sorts then slices; UI reflects all four in the URL. Tests for each param. Commit `feat: clients sorting and filtering with url state`.
2. **Audit trail** — `src/server/audit/` with `recordChange(actorId, targetId, field, from, to)` appended in the three users mutations; `GET /api/audit` for `users.list` scoped like users. Commit `feat: audit trail of user changes`.
3. **Loading and error states** — skeleton rows in `ClientsTable`/`UsersTable`, disabled buttons while a request is in flight. Commit `feat: loading and error states`.
4. **Docker** — multi-stage `Dockerfile` with `output: 'standalone'`. Commit `chore: dockerfile`.
