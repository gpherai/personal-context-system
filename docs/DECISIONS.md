# Decisions

This file records current architecture decisions and open questions.

## Accepted

- The app is single-user and private.
- The app is not a generator and not a todo list.
- The app should support both loose entries and strongly typed objects.
- The app should preserve all five UX modes: quiet dashboard, notebook, archive/cabinet, graph/map, command center.
- UI/UX quality is a first-class concern.
- The project should be designed broadly and completely up front; avoid reducing the planning document to an MVP-only scope.
- Gerald understands IT architecture and tradeoffs, but wants AI-assisted implementation and documentation that stays approachable for someone who does not program independently.
- PostgreSQL is the canonical source of truth.
- Prisma manages typed database access and migrations.
- The repository/app name is `personal-context-system` / Personal Context System.
- Use a layered architecture with domain, application, repositories, infrastructure, AI context, and UI.
- Zod schemas validate external input and generated projection shapes.
- Files remain important for AI access, but are generated projections rather than a second source of truth.
- `data/context-mirror` is generated, not edited by hand.
- Context mirror projections should include both Markdown and JSON where useful.
- AI should get safe read access first. Writes should go through validated app/CLI commands.
- A future CLI can expose context to AI tools.
- If AI can directly access the repository, generated files, helper CLI, or database safely, context export/copy is optional rather than central.
- MCP is interesting for later and is designed as an adapter over application/context services, not as the architectural core.
- The first implementation surfaces are Dashboard, Capture, Ledger, and Entry detail.
- Full-text search and structured filtering come before any vector search or embeddings.
- `detective`, `knowledge-base`, and `sanatana-kalender` remain separate canonical systems.
- Use Context7 or official documentation lookup for up-to-date framework/library guidance when implementation decisions depend on current APIs.
- Use npm as the package manager for this repository. Node and npm are already installed in the Fedora/Incus environment; pnpm is not installed.
- Use Docker Compose for the default local PostgreSQL setup. It reduces setup friction without hiding the database model.
- Use Tailwind CSS v4 with CSS-first theme tokens and PostCSS.
- Use Prisma ORM 7 with `prisma.config.ts`, explicit generated client output under `src/generated/prisma`, and `@prisma/adapter-pg`.
- Use the local `ui-ux-pro-max` skill for UI/UX direction when building or revising interface surfaces.
- The initial implementation should include Dashboard, Capture, Ledger, Cabinet, Entry detail, Command Center, generated context mirror, and the supporting domain/application layers.
- Use npm `overrides` only for narrow transitive security fixes when the latest direct package pins a vulnerable transitive version and the audit-suggested fix would downgrade major framework versions.

## Proposed

- Prisma should be the default database layer; lower-level SQL can be added only for search/query cases where Prisma is awkward.

## Needs Discussion

- Final storage model for generated files.
- Whether to use Prisma only or Prisma plus lower-level SQL for advanced search.
- Full-text search approach.
- Whether to add local authentication once the app contains daily-use data.
- Whether to add vector search after relational/full-text retrieval is proven insufficient.
