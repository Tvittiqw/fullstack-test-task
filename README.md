# User Management & Content

Next.js 16 App Router app with three fixed roles (IT, manager, user), an in-memory store and permissions enforced on the server for every request.

## Run

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

Other commands:

```bash
npm test             # Vitest, 75 tests
npm run lint         # ESLint + Prettier
npm run typecheck    # tsc --noEmit
npm run build && npm start
```

The store lives in memory, is seeded on first access and resets on restart. Passwords are stored in plain text because the task asks for it. The 1,200 clients are generated deterministically with `seedrandom`, so IDs and order are the same on every start. The client list is paginated on the server (`page`, `limit` 1 to 100, default 25), newest `createdAt` first.

Frontend: React Hook Form with zod resolvers using the same schemas as the server (`src/shared/schemas/`), TanStack Query for client data, no UI library, hand-written CSS.

## Seeded accounts

| Email                | Password    | Role    | Status      | Manager | Notes                          |
| -------------------- | ----------- | ------- | ----------- | ------- | ------------------------------ |
| ivan@example.com     | ivan123     | IT      | active      |         | scenarios 4 and 5              |
| petro@example.com    | petro123    | IT      | active      |         | the other IT                   |
| anna@example.com     | anna123     | manager | active      |         | four reports, scenarios 1 to 3 |
| oksana@example.com   | oksana123   | manager | active      |         | no reports                     |
| maksym@example.com   | maksym123   | manager | deactivated |         | cannot log in                  |
| olena@example.com    | olena123    | user    | active      | Anna    | scenario 6                     |
| kateryna@example.com | kateryna123 | user    | active      | Anna    |                                |
| andrii@example.com   | andrii123   | user    | active      | Anna    |                                |
| mykola@example.com   | mykola123   | user    | active      | Anna    |                                |
| dmytro@example.com   | dmytro123   | user    | active      | Maksym  | manager is deactivated         |
| yurii@example.com    | yurii123    | user    | deactivated |         | cannot log in                  |
| nazar@example.com    | nazar123    | user    | active      |         | no manager                     |

## Auth and rule 5

Opaque session token, no JWT. `POST /api/auth/login` creates a random token, stores `token -> userId` in an in-memory Map and sets it in an `HttpOnly`, `SameSite=Lax` cookie named `session`. Unknown email, wrong password and deactivated account all answer 401 `invalid_credentials`, so the form does not reveal which accounts exist.

Why: the store is already in memory and single-process, so a server-side session is the simplest thing that is correct. A JWT would carry the role and status inside the token and keep them valid until expiry, which is exactly what rule 5 forbids; making it work would need a revocation list, which is a session table by another name.

Rule 5 (a deactivated user is cut off on their very next request):

- Every route handler starts with `requireSession` (directly or through `requirePermission`). It reads the cookie, finds the session, and reloads the user from the store on every request. If the user is missing or not `active`, it deletes the session and throws 401 `unauthenticated`.
- Pages use the same check through `src/server/page-auth.ts` and redirect to `/login?expired=1`.
- The browser's fetch wrapper (`src/ui/api-client.ts`) does a full navigation to `/login?expired=1` on 401 `unauthenticated`.

Nothing has to be revoked when an IT user deactivates someone: the status change itself is what the next request sees. Role changes take effect the same way.

`src/proxy.ts` only checks that the `session` cookie exists and redirects to `/login` when it does not. It never validates the cookie and makes no permission decision.

## Where permissions are decided

Roles are not ranked. IT has the five `users.*` permissions and cannot view `/content`. A manager has `users.list`, `users.editProfile` and `content.view`, scoped to their own direct reports that are plain users. A user has `content.view`.

1. `src/server/access/policy.ts`: `ROLE_POLICY`, the data. Permissions, user scope, `keepOneActive` and landing route per role.
2. `src/server/access/authorize.ts`: `can`, `withinScope`, `canOnUser`, `visibleUsers`.
3. `src/server/access/user-change.ts`: `authorizeTargetEdit` and `authorizeUserChange`, checked in the order scope, then last active user of a `keepOneActive` role, then self change.
4. `src/server/auth/require-session.ts` and `src/server/auth/require-permission.ts`: the 401/403 gate every route handler calls first.
5. `src/server/page-auth.ts`: the same gate for pages, giving a redirect to `/login` or a rendered 403.

`src/server/users/users.service.ts` only maps a `Decision` to an HTTP error and validates `managerId` against `managerCandidates()`. The UI decides nothing: it hides controls based on the `permissions` list from `GET /api/auth/me`, and the server re-checks every request.

Adding a role is one row in `ROLE_POLICY` plus seed accounts and this README; see [AGENTS.md](AGENTS.md).

## API

Errors use `{ error: { code, message } }`. Order inside a handler: 401, 403, 400, 404, then scope and invariant checks.

| Method and path               | Required                                     | Notes                                                   |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| `POST /api/auth/login`        | public                                       | 401 `invalid_credentials`                               |
| `POST /api/auth/logout`       | public                                       | deletes the session if any, clears the cookie, 204      |
| `GET /api/auth/me`            | session                                      | user, `permissions`, `landingRoute`                     |
| `GET /api/users`              | `users.list`                                 | filtered by `visibleUsers`                              |
| `GET /api/users/managers`     | `users.create`                               | active managers for the create form                     |
| `POST /api/users`             | `users.create`                               | 400 `invalid_manager`, 409 `email_taken`                |
| `PATCH /api/users/:id`        | `users.editProfile` + scope                  | 403 `out_of_scope`                                      |
| `PATCH /api/users/:id/role`   | `users.changeRole` + `authorizeUserChange`   | 403 `self_change`, 409 `last_active_in_role`            |
| `PATCH /api/users/:id/status` | `users.changeStatus` + `authorizeUserChange` | 403 `self_change`, 409 `last_active_in_role`            |
| `GET /api/clients`            | `content.view`                               | `?page=1&limit=25`, returns `items, total, page, limit` |
| `GET /api/clients/:id`        | `content.view`                               | 404 when unknown                                        |

## Tests

```bash
npm test
```

Vitest, 75 tests: the policy matrix, `authorize` scope rules, `user-change` ordering, the HTTP error envelope, and API tests per route, including the six walkthrough scenarios. More in [docs/TESTING.md](docs/TESTING.md).

## Next four hours

1. Session expiry and rotation, and set the `Secure` cookie flag from the deployment rather than `NODE_ENV`.
2. Replace the in-memory store with a database behind the existing repository seam (`users.repository.ts`, `clients.repository.ts`) without touching services or access.
3. A dedicated scenarios test file that reads like the task's walkthrough.
4. Sorting and filtering on the client table, with the state in the URL.
5. An audit trail of who changed what.
6. Docker.
7. Upgrade the lint toolchain to clear the moderate `npm audit` findings in the transitive `minimatch` package; nothing at runtime depends on it.
