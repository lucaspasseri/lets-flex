# General Guidelines

## Rule levels

- **Required:** non-negotiable project constraints.
- **Preferred:** conventions to follow normally; document the reason for a departure.
- **Conditional:** required when the described kind of change is in scope.

## Project and architecture

Let’s Flex is a modular monolith built with Node.js, Express, EJS, and PostgreSQL.

Required:

- Preserve the established separation between routes, validation and authorization
  middleware, controllers, services or use cases, repositories, mappers and view models,
  EJS views, and browser scripts.
- Keep controllers focused on HTTP concerns, persistence and SQL in repositories, and
  business rules outside views and route definitions when practical.
- Do not migrate to TypeScript, React, or another architectural model unless explicitly
  requested.

Preferred:

- Favor simple, predictable, maintainable solutions over unnecessary abstraction.
- Follow the existing feature-based structure and reuse existing helpers and patterns.
- Avoid abstractions created only for speculative future use.

## JavaScript and boundaries

Required:

- Maintain compatibility with the configured `checkJs` type checking.
- Treat request input as untrusted and use the established Zod validation and sanitization
  pattern. Controllers must use validated input rather than raw request bodies.
- Keep validation and authorization as separate concerns.
- Store secrets only in environment variables. Never commit, display, or log API keys,
  password hashes, raw authentication tokens, session secrets, or OAuth client secrets.
- Automated tests must use fakes or mocks and must not send real emails.

Preferred:

- Follow existing ES module and JSDoc conventions.
- Use explicit contracts at important repository, service, view-model, and shared-component
  boundaries.
- Keep external providers behind application-owned boundaries and handle provider failures
  without exposing sensitive details.

Conditional:

- **Database changes:** inspect affected repositories, queries, seeds, migrations, and
  tests. Use constraints for invariants and transactions for writes that must succeed or
  fail together. Document deployment order, compatibility, and rollback expectations when
  they are relevant.
- **New production dependencies or external providers:** explain why the current stack is
  insufficient and obtain explicit approval before adding or replacing one.

## Security-sensitive changes

For authentication, authorization, session, credential, or form changes, explicitly
evaluate the applicable items below. Record why an item is not relevant rather than
implementing every control indiscriminately.

- CSRF protection for state-changing requests;
- rate limiting and resistance to automated abuse;
- session rotation or invalidation after security-sensitive events;
- exclusion of credentials, tokens, reset links, and sensitive personal data from logs;
- generic responses where detailed errors could enable account enumeration;
- validation and sanitization at every trust boundary;
- expiring, single-use security tokens stored in a safe form;
- database migration, deployment-order, compatibility, and rollback concerns;
- focused tests for applicable success, failure, expiry, replay, authorization, and abuse
  cases.

## Scope

Required:

- Work toward one cohesive, reviewable outcome.
- Do not include unrelated cleanup, redesign, or refactoring.
- Report useful out-of-scope improvements instead of implementing them silently.

If a task becomes significantly larger than expected, pause implementation, explain the
discovery and its impact, recommend whether to continue, split, or revise the work, and
wait for approval when product behavior, architecture, security, or data is affected.
For active-goal work, also record the discovery in `docs/current-actions.md`; tasks outside
the active goal must not modify that file.

## Verification matrix

Run the narrowest relevant tests first, then apply this matrix:

| Change type                     | Required verification                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| All code changes                | `npm run format:check` and `npm run lint`                                                                              |
| Backend/server changes          | `npm run check:types` and relevant automated tests                                                                     |
| Browser-side JavaScript changes | `npm run check:browser-types` and relevant tests                                                                       |
| Broad or cross-cutting changes  | `npm run verify`                                                                                                       |
| Documentation only              | Inspect the rendered Markdown or final diff; run code checks only when executable tooling or configuration is affected |

`npm run format:check` verifies formatting without modifying files. `npm run format`
rewrites files and must be used only when formatting changes are intentional.

A failed, skipped, or unavailable check is not successful verification. The final report
must distinguish checks that passed, checks that failed, checks not run and why, and any
manual verification still required.

Inspect the final diff for unintended or unrelated changes.

## Completion report

Report the behavior changed, main files changed, exact verification results, remaining
risks or manual checks, skipped checks with reasons, and documentation updates. Prefer a
concise outcome summary over a long file-by-file narration unless requested.
