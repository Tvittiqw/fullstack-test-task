# Conventions

## Schemas

- A zod schema is the DTO. Infer the type from it, never declare both.
- Enums come from the shared const arrays: `z.enum(ROLES)`, `z.enum(USER_STATUSES)`.
- Request bodies are parsed with `parseBody(request, schema)`, queries with `parseQuery(url, schema)`. Zod errors become 400 `validation`.

## Errors

- Throw `HttpError(status, code, message, details?)` from `src/server/http/errors.ts`.
- Every route handler is wrapped in `handle()`. The response envelope is always `{ error: { code, message, details? } }`.
- Denials from `access/user-change.ts` are mapped by `fromDenial` in `require-permission.ts`; do not map them by hand. New denial reasons are rows of `DENIALS`.

## Types

- `PublicUser = Omit<User, 'password'>` is the only user shape that leaves `src/server`. Repositories strip the password.
- Exported server functions have explicit return types.
- `noUncheckedIndexedAccess` is on: handle `undefined` from every index and `Map.get`.

## Naming

- Domain files: `<domain>.schema.ts`, `<domain>.repository.ts`, `<domain>.service.ts`.
- Route handlers export `GET`, `POST`, `PATCH` from `route.ts`.
- Client components live in `src/ui/components/` and import only `src/ui` and `src/shared`.

## General

- No `any`, no `@ts-ignore` (lint errors).
- No code comments. Rename or split instead.
- No role literals outside `src/shared/roles.ts`, the seed, and tests.
- No business logic in route handlers or pages.
- Prettier: single quotes, trailing commas.
