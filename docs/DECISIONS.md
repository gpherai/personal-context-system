# Decisions

This file is the authoritative record of architecture decisions and open questions for the Personal Context System.

Updated: 2026-04-30

## Accepted

### Product and scope
- The app is single-user and private.
- The app is not a generator and not a todo list.
- The app should support both loose entries and strongly typed objects.
- The app should preserve all five UX modes: quiet dashboard, notebook, archive/cabinet, graph/map, command center.
- UI/UX quality is a first-class concern.
- The project should be designed broadly and completely up front; avoid reducing the planning document to an MVP-only scope.
- Gerald understands IT architecture and tradeoffs, but wants AI-assisted implementation and documentation that stays approachable for someone who does not program independently.
- `detective`, `knowledge-base`, and `sanatana-kalender` remain separate canonical systems with their own data models.

### Identity and naming
- The repository and application name is `personal-context-system` / Personal Context System.

### Data and persistence
- PostgreSQL is the canonical source of truth.
- Prisma is the default database layer; lower-level SQL may be added only for search or query cases where Prisma is awkward.
- Prisma manages typed database access and migrations.
- Generated files live at `data/context-mirror/` on the local filesystem. They are git-ignored and rebuilt from the database on demand. They are not a second source of truth.
- `data/context-mirror` is generated, not edited by hand.
- Context mirror projections include both Markdown and JSON where useful.

### Architecture and layers
- Use a layered architecture with domain, application, repositories, infrastructure, AI context, and UI.
- Zod schemas validate external input and generated projection shapes.
- AI should get safe read access first. Writes should go through validated app/CLI commands.
- A future CLI can expose context to AI tools. The CLI will be an adapter over existing application and context services.
- If AI can directly access the repository, generated files, helper CLI, or database safely, context export/copy is optional rather than central.
- MCP is interesting for later and is designed as an adapter over application/context services, not as the architectural core.

### Implementation scope and order
- The first implementation surfaces are Dashboard, Capture, Ledger, and Entry detail.
- The initial implementation includes Dashboard, Capture, Ledger, Cabinet, Entry detail, Command Center, generated context mirror, and the supporting domain and application layers.
- The web application is built before any CLI adapter.
- The `/map` graph view is a planned route but deferred until Cabinet views are stable and sufficient relationship data exists.
- Full-text search and structured filtering come before any vector search or embeddings.
- Use PostgreSQL native full-text search with a GIN index for entry text search. Prisma raw SQL is acceptable for this query path when Prisma's high-level API is too limited.
- User-defined saved filters are modeled as database records with JSONB query params. Stable system filters remain static UI shortcuts so a fresh install has useful starting points before any user-defined filter exists.
- `Entry.type = "question"` is the capture-side representation of a first-class `Question`. Creating a question entry auto-creates and links the tracked Question. Existing entries can be promoted explicitly from entry detail.
- `open_loop` remains separate from `question`: use it for unresolved thoughts or actions that need closure but are not yet framed as tracked Questions.
- Question status semantics are fixed as: `open` = captured but not currently worked, `active` = currently worked, `parked` = intentionally deferred, `answered` = resolved, `reframed` = superseded by a clearer question, `abandoned` = no longer useful enough to keep active.

### Technology choices
- Use npm as the package manager for this repository. Node and npm are already installed in the Fedora/Incus environment; pnpm is not installed.
- Use Docker Compose for the default local PostgreSQL setup. It reduces setup friction without hiding the database model.
- Use Tailwind CSS v4 with CSS-first theme tokens and PostCSS.
- Use Prisma ORM 7 with `prisma.config.ts`, explicit generated client output under `src/generated/prisma`, and `@prisma/adapter-pg`.
- Use lucide-react for icons. No Radix UI or shadcn/ui component library; UI components are built from scratch with Tailwind CSS.
- Use npm `overrides` only for narrow transitive security fixes when the latest direct package pins a vulnerable transitive version and the audit-suggested fix would downgrade major framework versions.

### Development and tooling
- Use Context7 or official documentation lookup for up-to-date framework/library guidance when implementation decisions depend on current APIs.
- Use the local `ui-ux-pro-max` skill for UI/UX direction when building or revising interface surfaces.
- When building or revising interface surfaces, follow the design principles in `docs/UI-IA.md` and verify current framework API patterns before implementation.

## Needs Discussion

- Whether to add local authentication once the app contains daily-use data.
- Whether to add vector search after relational and full-text retrieval is proven insufficient.
