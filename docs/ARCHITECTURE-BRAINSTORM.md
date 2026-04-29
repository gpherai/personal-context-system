# Personal Context System - Architecture Brainstorm

Updated: 2026-04-29

## Core Idea

Personal Context System is a personal context layer for Gerald's thoughts, interests, projects, observations, questions, patterns, and AI workflows.

It is not a generator app and not a todo app. It should be useful both for daily use and for deeper thinking.

The app should collect and structure personal context so Gerald and AI tools can reason with it later.

## Relationship To Existing Projects

- `sanatana-kalender`: spiritual calendar, panchanga, sadhana tracker, kundali, weather, encyclopedia. Do not rebuild this.
- `knowledge-base`: structured Sanatana content, sources, deities, traditions, topics, tags. Still in development. Keep separate for now.
- `detective`: external-world structured investigation system for people, events, organizations, timelines, sources, links, geopolitical/current-event datasets.
- `vibe-wallpaper`: Linux wallpaper manager. Good future expansion candidate, but not now.
- `personal-context-system`: Gerald's personal context, interests, observations, thoughts, questions, project direction, curiosity map, and AI context layer.

External-world data can later connect to this system, but for now it should stay conceptually separate from `detective`. Gerald's personal reflection on external events belongs here; the external event graph itself belongs in `detective`.

## Four Original Concepts To Preserve

### 1. Life Index

A daily/ongoing index of what Gerald is thinking about, researching, following, or noticing.

Examples:
- What am I thinking about?
- What am I researching?
- Which projects are pulling my attention?
- Which world events keep coming back?
- Which questions or tensions are active?
- What was happening in a given week or period?

Value:
- Daily usable.
- Gives AI current personal context.
- Enables period-based review.

### 2. Thinking Ledger

A structured thought ledger for small mental objects:
- observation
- question
- suspicion
- insight
- irritation
- fascination
- open loop
- decision/direction
- inner contradiction

Value:
- Useful for thinking and reflection.
- Less heavy than a formal diary.
- Makes thoughts retrievable and discussable with AI.

### 3. Personal Context Server

The app should function as a context layer for AI tools outside the app.

Gerald uses AI through browser chat and CLI/build tools such as ChatGPT, Claude, Gemini, and Codex. The app should make its data easy to access from those workflows.

Possible interfaces:
- generated AI-readable files
- read-only database access
- helper CLI commands
- future MCP server
- future local API

Context export/copy is useful, but not necessarily the primary goal if AI tools can directly access the repository, generated files, CLI helpers, or database safely.

Examples:
- `context today`
- `context topic iran`
- `context projects`
- `context open-questions`
- `context sanatana`
- `context detective`

Value:
- AI does not need to be fully embedded in the app.
- Rich context can improve external AI conversations.
- Fits browser-chat plus CLI/build workflows.

### 4. Curiosity Map

A map of Gerald's interests, fascinations, and recurring themes.

Possible nodes:
- timelines
- rituals/cycles
- spiritual discipline
- geopolitics
- hidden networks / power
- AI as research partner
- Linux desktop aesthetics
- archives
- detective boards
- app ideas
- design feeling

Entries can attach to multiple nodes. This should not be as heavy as the detective app; it is about Gerald's own thinking and interests.

## UX Vibes

All five vibes are desired, each as a mode/view rather than a single style:

### Quiet Dashboard

Start screen for daily use:
- today
- recent entries
- active questions
- active themes
- current projects
- quick context actions

### Notebook

Writing-first mode:
- short entries
- longer reflections
- markdown-style writing
- backlinks/references

### Archive / Cabinet

The core vibe:
- structured objects
- metadata
- types
- tags/themes
- relations
- filtering
- calm browsing

### Graph / Map

Secondary analysis view:
- relationship graph
- theme map
- project/thought network
- not the primary editing UI

### Command Center

Power-user AI/context workflow:
- build context
- inspect links
- filter by topic, type, period, project
- prepare data for external AI tools

## Product Principles

- Single-user private tool.
- Modern professional engineering despite solo use.
- Design architecture up front in a broad and complete way; do not frame the work as a minimal MVP-first build.
- No generator app.
- No todo list.
- Both loose entries and strongly typed objects.
- AI can act as mirror, analyst, conversation partner, coach, archivist, critic, or research assistant depending on situation.
- UI/UX quality matters; the app should feel polished and intentional.
- The system should support future screenshots, links, music, film, games, world events, code projects, personal logs, and spiritual practice context, but these do not all need to be first build targets.

## User / Collaboration Context

Gerald has a BSc in Technical Computer Science and is finishing an MSc in ICT in Business. He understands IT concepts, architecture, and engineering tradeoffs, but does not consider himself able to program independently.

This means the project should be designed and documented as a professional software system, while implementation workflows should remain AI-assisted and approachable:

- clear architecture and rationale
- explicit layers and ownership boundaries
- strong conventions
- readable documentation
- predictable scripts
- safe defaults
- clear generated artifacts versus source-of-truth data
- no hidden magic that only an experienced programmer can safely operate

## Data Philosophy

Primary requirement: data must be useful for both the app and AI tools.

Recommended direction:

- PostgreSQL is the canonical source of truth.
- Prisma manages typed database access and migrations.
- Files are generated AI-readable projections, not a second source of truth.
- Generated files can be deleted and rebuilt from the database.

Possible structure:

```txt
data/
  context-mirror/
    ai-index.md
    today.md
    entries/
    themes/
    projects/
    questions/
    threads/
    timeline/
  attachments/
  exports/
```

Canonical data should live in Postgres. `context-mirror` files are materialized views/projections for CLI AI tools and human inspection.

This avoids split-brain data while still allowing AI to read plain files.

## AI Access Model

AI should first get read access, not unrestricted write access.

Recommended access layers:

1. AI-readable generated files.
2. Read-only database user or query tool.
3. Helper CLI.
4. Future MCP server.
5. Optional in-app AI chat later.

AI write access, if ever added, should go through explicit validated commands/services, not direct table mutation.

## Possible MCP Direction

MCP is interesting but should be treated as a future adapter, not the architectural core.

Possible resources:
- `pcs://today`
- `pcs://theme/{slug}`
- `pcs://project/{slug}`
- `pcs://open-questions`
- `pcs://entry/{id}`

Possible tools:
- `search_entries`
- `get_context`
- `create_observation`
- `link_entries`
- `summarize_thread`

## Preliminary Tech Direction

Likely stack:

- TypeScript
- Next.js App Router
- React
- PostgreSQL
- Prisma
- Zod
- Tailwind CSS
- Radix/shadcn-style components
- lucide-react icons
- generated markdown/json context mirror
- later CLI
- later MCP server

Layering:

```txt
src/domain        types, schemas, invariants
src/application   use cases and workflows
src/repositories  repository interfaces
src/infrastructure Prisma, file projections, search, adapters
src/ai-context    context builders, mirrors, future MCP resources/tools
src/app           Next.js routes, pages, actions
src/components    UI components
```

Rule: UI must not directly mutate the database or files. Mutations go through application services/use cases and validation.

## Open Design Questions

- Exact project name and visual identity.
- Whether to start as webapp only or also include a CLI package from day one.
- Whether the generated context mirror should be markdown only, JSON only, or both.
- How typed should entries be at the database level versus flexible metadata.
- How to model links/relationships generically without creating a confusing graph too early.
- How to keep `detective` external-world data separate while allowing future integration.
- Which UI mode is the first primary surface: dashboard, inbox, cabinet, or ledger.
- Whether to include authentication at all for a local single-user app.
- Deployment model: local dev server, Docker, or production-style local service.

## Canonical Architecture

The refined architecture has been moved to `docs/ARCHITECTURE.md`.

Keep this file as the raw product and architecture brainstorm: original concepts, constraints, vibes, and unresolved questions. Use `docs/ARCHITECTURE.md` as the current buildable architecture, and use `docs/DECISIONS.md` for accepted decisions and remaining open questions.
