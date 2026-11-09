# Architecture

## Layer rules

| Layer | Owns | Never does |
|-------|------|------------|
| **Route handler** (`src/app/api/**`) | HTTP mapping: parse, call `requirePermission`, call service, respond | Business decisions, store access |
| **Service** (`src/server/<domain>/*.service.ts`) | Business logic, invariants, calls into `access/` | Store internals, HTTP types |
| **Repository** (`src/server/<domain>/*.repository.ts`) | Reads and writes against the store, strips `password` | Business decisions |
| **Store** (`src/server/store/`) | The in-memory data and the seed | Logic |

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
  ui/           api-client.ts, components/
test/
  unit/         access, users, clients
  api/          auth, users, clients, scenarios
  helpers/      request builders, loginAs
```

Import direction: `shared` ← `server` ← `app`. `ui` sees only `shared`.

## Access module

- `policy.ts`: `ROLE_POLICY: Record<Role, RolePolicy>`. Each row has `permissions`, `userScope` (`'all' | 'reports' | null`) and `landingRoute`. A new role without a row does not compile.
- `authorize.ts`: permission and scope lookups, `can(actor, permission)`, `canOnUser(actor, permission, target)`, `visibleUsers(actor, all)`.
- `user-change.ts`: the invariants on role and status changes, `authorizeUserChange(actor, target, change, users)`. Returns `{ ok: true }` or `{ ok: false, denial }`. Each denial is a row of `DENIALS`: `lastActiveIt` (kind `conflict`, 409) and `selfChange` (kind `forbidden`, 403).
- Evaluation order inside a mutating request: session 401 → permission 403 → body 400 → target 404 → `last_active_it` 409 → `self_change` 403 → write.

## Sessions

Opaque token in an HttpOnly cookie named `session`, mapped to a user id in `store.sessions`. `requireSession` reads the cookie, loads the session, reloads the user and rejects anything but `status === 'active'`. That reload is how deactivation takes effect on the next request.

`src/proxy.ts` redirects to `/login` when the cookie is missing. A stale cookie passes the proxy, fails `requireSession`, and the page redirects once to `/login?expired=1`, where the login page clears it.

## Store

`getStore()` returns the object cached on `globalThis.__userManagementStore`, building it from the seed on first call. `resetStore()` rebuilds it; tests call it in `beforeEach`. Clients are sorted once at seed time (`createdAt` desc, then `id`), so pagination is a slice.
