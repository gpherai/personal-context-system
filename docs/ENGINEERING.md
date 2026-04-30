# Engineering Practices

Updated: 2026-04-30

## Purpose

This document defines how the project should be built. It turns the architecture into day-to-day engineering rules so AI-assisted implementation stays understandable, reviewable, and maintainable.

## Operating Principles

- Make the database the only durable source of truth.
- Keep generated files deterministic, inspectable, and rebuildable.
- Prefer boring, explicit code over clever framework shortcuts.
- Keep dependencies current, but verify current APIs before adopting patterns.
- Preserve clear boundaries between personal context, external investigation data, Sanatana knowledge, and unrelated projects.
- Treat AI integration as an adapter around application services, not as an uncontrolled database client.
- Optimize the app for daily use, retrieval, and trust rather than novelty.

## Layer Rules

Dependency direction:

```txt
UI routes/actions
  -> application services
  -> repository interfaces
  -> infrastructure implementations
  -> Prisma/PostgreSQL/filesystem
```

Rules:

- `src/app` and `src/components` may call application services or typed query helpers.
- UI code must not call Prisma directly.
- Application services own validation, invariants, and workflow decisions.
- Domain modules define enums, schemas, types, and small pure helpers.
- Infrastructure modules adapt Prisma, files, process env, and future external systems.
- Context mirror generation reads durable state and writes generated artifacts; it never becomes a hand-edited store.

## Validation

Use Zod at boundaries:

- Server action `FormData`
- CLI/script inputs
- future MCP tool inputs
- generated JSON projection shapes where useful
- flexible `metadata` payloads when entry type-specific rules are needed

Use TypeScript types inside already-validated code. Do not duplicate every type manually when it can be inferred from a Zod schema.

## Database And Migrations

- Every durable schema change goes through Prisma schema and a committed migration.
- Use relational columns for stable, queried fields.
- Use JSONB only for flexible metadata that is not yet worth modeling relationally.
- Add indexes for actual query paths: dates, statuses, types, slugs, relationship endpoints, and search.
- Keep seed data small and clearly marked as development/demo data.

## Error Handling

- Fail fast for missing required configuration in scripts and writes.
- UI read surfaces should degrade with a setup notice when the local database is unavailable.
- Server actions should validate inputs and return user-facing field errors where possible.
- Do not hide data loss, projection failures, or migration failures behind generic success states.

## Testing

Minimum test layers:

- Domain validation tests for entry commands and relationship commands.
- Application service tests with in-memory repositories for create/query behavior.
- Projection tests for generated Markdown/JSON shape.
- UI smoke tests once a flow becomes important enough to break trust.

Database integration tests can be added after the initial schema stabilizes. Generated context is product behavior and should have tests.

## UI Engineering

The interface is a work tool, not a landing page.

- Follow the design principles in `docs/UI-IA.md` when building or revising interface surfaces.
- Prefer semantic HTML, stable layouts, visible focus states, and keyboard-friendly forms.
- Use lucide-react for icon buttons and clear affordances.
- Keep cards for repeated items or framed tools only; do not nest cards.
- Avoid oversized hero composition, decorative gradients, emoji icons, and one-note color palettes.
- Ensure mobile layouts fit at 375px without horizontal scrolling.
- Use restrained colors: neutral base, blue primary action, and limited semantic accents.

## Dependency Policy

- Use current stable packages when starting a new implementation.
- Confirm framework patterns against Context7 or official documentation when APIs are version-sensitive.
- Avoid adding a dependency for small utilities that are easy and clearer to own locally.
- Do not add AI-provider SDKs until an explicit provider integration exists.

Current starting stack:

- Next.js App Router
- React
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod
- Tailwind CSS
- lucide-react
- Vitest

## Git And Review Hygiene

- Keep commits coherent and explain why a change exists.
- Before commit, run at least typecheck, lint, and focused tests.
- If a change explicitly excludes tests, still run typecheck and lint and state that tests were intentionally not run.
- Separate generated/private data from source code using `.gitignore`.
- Do not commit secrets, local `.env`, database dumps, attachments, or generated context mirrors.
