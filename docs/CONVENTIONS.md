# Conventions

## Schemas

- A zod schema is the DTO. Infer the type from it, never declare both. Request schemas live in `src/shared/schemas/` so the same definition validates on the server (`parseBody`) and in the browser (`zodResolver`); query-string schemas that only the server needs stay next to their service.
- Enums come from the shared const arrays: `z.enum(ROLES)`, `z.enum(USER_STATUSES)`.
- Request bodies are parsed with `parseBody(request, schema)`, queries with `parseQuery(request, schema)`. A non-JSON body is 415, malformed JSON is 400 `invalid_json`, schema errors are 400 `validation`.

## Errors

- Throw `HttpError(status, code, message, details?)` from `src/server/http/errors.ts`.
- Every route handler is wrapped in `handle()`. The response envelope is always `{ error: { code, message, details? } }`.
- Denials from `access/user-change.ts` are mapped by `fromDenial` in `http/errors.ts`; do not map them by hand. New denial reasons are rows of `DENIALS`.

## Types

- `PublicUser = Omit<User, 'password'>` is the only user shape that leaves `src/server`. Repositories strip the password.
- Exported server functions have explicit return types.
- `noUncheckedIndexedAccess` is on: handle `undefined` from every index and `Map.get`.

## Naming

- Domain files: `<domain>.repository.ts`, `<domain>.service.ts`; shared request schemas in `src/shared/schemas/<domain>.ts`.
- Route handlers export `GET`, `POST`, `PATCH` from `route.ts`.
- Client components live under `src/ui/`: shared pieces in `primitives/` and `layout/`, feature pieces in a folder per feature. One component per file, named export, props typed as `type XProps`. They import only `src/ui` and `src/shared`.
- Server data in client components goes through TanStack Query. Each feature folder has `<feature>-api.ts` (typed `apiFetch` calls, pure mappers such as `toCreateUserBody`) and `<feature>-queries.ts` (`useQuery` / `useMutation` hooks keyed by `query-keys.ts`; mutations invalidate the affected key on success). Components import the hooks, never `apiFetch` or `useQuery` directly. No hand-rolled fetch effects.
- Forms use `react-hook-form` with `zodResolver(schema)` from `src/shared/schemas/`; fields are `TextField` / `SelectField` (label, error line, `aria-invalid`) that take the `register` props by spread; server errors render through `ErrorMessage`.

## General

- No `any`, no `@ts-ignore` (lint errors).
- No code comments. Rename or split instead.
- No role literals outside `src/shared/roles.ts`, the seed, and tests.
- No business logic in route handlers or pages.
- Prettier: single quotes, trailing commas.
