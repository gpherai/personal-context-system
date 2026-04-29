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

## Proposed

- Docker Compose may be included from the start if it reduces PostgreSQL setup friction.
- Prisma should be the default database layer; lower-level SQL can be added only for search/query cases where Prisma is awkward.

## Needs Discussion

- Final storage model for generated files.
- Whether to include Docker from the start.
- Whether to use Prisma only or Prisma plus lower-level SQL for advanced search.
- Full-text search approach.
- Theme/design system direction.
- Whether to install and use the local `ui-ux-pro-max` skill in this repository.
