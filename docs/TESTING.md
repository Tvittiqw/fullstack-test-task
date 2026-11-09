# Testing

```bash
npm test                           # all tests
npx vitest run test/path.test.ts   # single file
npm run test:watch                 # watch mode
```

Vitest, `environment: node`. No dev server, no browser.

## What to test

| Layer             | Type | How                                                                                                                                                           |
| ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `access/`         | Unit | Call `can`, `canOnUser`, `visibleUsers`, `authorizeUserChange` with plain `PublicUser` objects from `test/helpers/users.ts`; assert denials against `DENIALS` |
| Services          | Unit | Real store, `resetStore()` in `beforeEach`; no mocks                                                                                                          |
| Route handlers    | API  | Import the exported `GET`/`POST`/`PATCH`, call with `new Request(...)` and `{ params: Promise.resolve({ id }) }`                                              |
| Pages, components | None | Not graded, not tested                                                                                                                                        |

## Helpers (`test/helpers/`)

- `req(method, path, { body?, cookie? })` builds a `Request`.
- `loginAs(email)` logs in through the real login handler and returns a `cookie` header. Passwords are `<name>123`.
- `ctx(params)` builds the route handler context.
- `user(overrides)` builds a `PublicUser` for access tests.

## Rules

- Test file first, watch it fail, then implement.
- One `describe` per function or endpoint. Test the contract, not the implementation.
- `clearMocks: true` is set in `vitest.config.ts`.
- The six task scenarios live in `test/api/scenarios.test.ts` and must stay green.
