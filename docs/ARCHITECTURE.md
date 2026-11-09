# Architecture

## Layer rules

| Layer                                                  | Owns                                                                                     | Never does                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Route handler** (`src/app/api/**`)                   | HTTP mapping: `requirePermission`, then parse, then service, then respond                | Business decisions, store access                                |
| **Service** (`src/server/<domain>/*.service.ts`)       | Business logic, calls into `access/`, maps denials with `fromDenial`, throws `HttpError` | Store internals, `Request`/`Response` objects, role comparisons |
| **Repository** (`src/server/<domain>/*.repository.ts`) | Reads and writes against the store, strips `password`                                    | Business decisions                                              |
| **Store** (`src/server/store/`)                        | The in-memory data and the seed                                                          | Logic                                                           |

## Folders

```
src/
  proxy.ts                        cookie presence only → /login
  app/                            pages and api route handlers
  shared/                         ROLES, PERMISSIONS, API types; imports nothing
  server/
    store/      store.ts, seed/   globalThis-cached store, deterministic seed
    access/     policy.ts, authorize.ts, user-change.ts
    auth/       sessions.ts, credentials.ts, require-session.ts, require-permission.ts
    users/      users.schema.ts, users.repository.ts, users.service.ts
    clients/    clients.schema.ts, clients.repository.ts, clients.service.ts
    http/       errors.ts, respond.ts, handle.ts
    page-auth.ts                  session and permission checks for server components
    page-load.ts                  loadOrNotFound: service 404 → notFound() for pages
  ui/           api-client.ts, format.ts, hooks/, primitives/, layout/, auth/, clients/, users/
test/
  unit/         store, access, http, users, clients
  api/          auth, users, clients, scenarios
  helpers/      request builders, loginAs, user fixtures
```

Import direction: `shared` ← `server` ← `app`. `ui` sees only `shared`.

## Access module

- `policy.ts`: `ROLE_POLICY: Record<Role, RolePolicy>`. Each row has `permissions`, `userScope` (`'all' | 'reports' | null`), `keepOneActive` and `landingRoute`. A new role without a row does not compile.
- `authorize.ts`: permission and scope lookups, `can(actor, permission)`, `canOnUser(actor, permission, target)`, `visibleUsers(actor, all)`. The `reports` scope reaches a target only if `target.managerId === actor.id` and the target's own role has no user scope.
- `user-change.ts`: decisions about a target user. `authorizeTargetEdit(actor, target)` checks scope; `authorizeUserChange(actor, target, change, users)` checks scope, then the invariants on role and status changes. Both return `{ ok: true }` or `{ ok: false, denial }`. Each denial is a row of `DENIALS`: `outOfScope` (403), `lastActiveInRole` (409, roles with `keepOneActive`), `selfChange` (403).
- Evaluation order inside a mutating request: session 401 → permission 403 → body 400 → target 404 → `out_of_scope` 403 → `last_active_in_role` 409 → `self_change` 403 → write.

## Sessions

Opaque token in an HttpOnly cookie named `session`, mapped to a user id in `store.sessions`. `requireSession` reads the cookie, loads the session, reloads the user and rejects anything but `status === 'active'`. That reload is how deactivation takes effect on the next request.

`src/proxy.ts` redirects to `/login` when the cookie is missing. A stale cookie passes the proxy, fails `requireSession`, and the page redirects once to `/login?expired=1`, where the login page clears it.

## Store

`getStore()` returns the object cached on `globalThis.__userManagementStore`, building it from the seed on first call. `resetStore()` rebuilds it; tests call it in `beforeEach`. Clients are sorted once at seed time (`createdAt` desc, then `id`), so pagination is a slice.
