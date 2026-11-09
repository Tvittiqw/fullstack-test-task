# Guardrails

Hard constraints that require explicit approval or must never be violated.

## Approval required

- **New dependencies** — any `npm install` needs discussion first.
- **API shape changes** — changing a path, body, or response shape needs sign-off.
- **Policy semantics** — changing what a role may do, the denial codes, or the check order in `authorizeUserChange`.

## Never do

- No `any`, no `@ts-ignore`.
- No role literal outside `src/shared/roles.ts`, the seed, and tests.
- No permission logic in `src/ui/` or in any `'use client'` file.
- No fetching all clients to the browser; the list is paginated on the server.
- No secrets or real credentials; the seed passwords are the only passwords in the repo.
- No comments in code.

## When in doubt

- Prefer additive changes over destructive ones.
- Prefer explicit over implicit.
- Ask before refactoring across `src/server` domains.
