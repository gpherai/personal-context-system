# Personal Context System - Architecture

Updated: 2026-05-26

## Purpose

Personal Context System is a private single-user application for capturing, structuring, connecting, and reusing Gerald's personal context with AI.

It is not a generator app, todo app, public knowledge base, or external investigation database. It is the personal context layer around Gerald's thoughts, observations, active questions, projects, themes, and AI workflows.

## Target Shape

The system is a local-first private web application with a structured database core and deliberately generated AI-facing projections.

Baseline architecture:

- Next.js application for the main user experience.
- PostgreSQL as canonical source of truth.
- Prisma as the primary typed persistence layer.
- Zod for runtime validation at external and application boundaries.
- Generated markdown and JSON context mirror under `data/context-mirror`.
- Application services that own writes and enforce invariants.
- Future CLI and MCP server as adapters over the same application and context services.

Core distinction:

- The database stores durable personal context.
- The app edits and explores that context.
- The context mirror publishes selected AI-readable views.
- AI tools consume the mirror, CLI, read-only database access, or future MCP resources.
- AI write actions, if added, go through explicit validated commands.

## Scope

In scope:

- Personal thoughts, observations, questions, reflections, interests, projects, and recurring themes.
- Gerald's interpretation of external events.
- References to media, code projects, spiritual practice, research topics, and AI conversations.
- AI-readable context assembly.
- Local search, filtering, linking, review, and export.

Out of scope for the core system:

- Full external-world investigation datasets. Those belong in `detective`.
- Sanatana calendar and practice mechanics. Those belong in `sanatana-kalender`.
- Calendar replacement, habit tracking, recurring todos, and general task management.
- Autonomous AI mutation of the knowledge base.

Note: Sanatana source material (books, videos, teachings, etc.) and their taxonomy (deities, traditions, topics) are now in scope via the `Source` and `Theme` models. The separate `knowledge-base` app is being migrated into this system.

## Architecture Goals

Optimize for:

- Long-lived personal knowledge.
- Low-friction daily capture.
- Retrieval by time, theme, project, question, type, and relationship.
- Safe AI interoperability.
- Clear code ownership boundaries.
- Generated artifacts that can be inspected and rebuilt.
- Operation that remains understandable with AI-assisted development.

Avoid:

- Split-brain source of truth between database and markdown.
- Premature graph complexity.
- Treating AI chat as the core product.
- Direct database mutation from UI or AI tools.
- Turning loose thoughts into second-class records.

## Code Layers

Recommended source layout:

```txt
src/domain          types, schemas, invariants
src/application     use cases and workflows
src/repositories    repository interfaces
src/infrastructure  Prisma, file projections, search, adapters
src/ai-context      context builders, mirror generation, future MCP resources
src/app             Next.js routes, pages, server actions
src/components      UI components
```

Rules:

- UI components do not call Prisma directly.
- Server actions call application services.
- Application services validate commands and enforce invariants.
- Repositories hide Prisma details from domain and application layers.
- Projection builders read durable state and generate files deterministically.

## Core Domain Model

### Entry

`Entry` is the central capture unit.

Likely fields:

- `id`
- `type`
- `title`
- `body`
- `summary`
- `capturedAt`
- `occurredAt`
- `updatedAt`
- `status`
- `source`
- `confidence`
- `privacyLevel`
- `metadata`

Suggested types:

- `observation`
- `question` — a captured question that is also promoted into a first-class `Question`
- `insight`
- `suspicion` — a weak hypothesis or hunch, less settled than an `insight`
- `reflection`
- `open_loop` — an unresolved thought or action that needs closure but is not yet a tracked `Question`
- `decision`
- `project_note`
- `media_note`
- `event_reflection`
- `practice_note`
- `ai_conversation_note`

Types should guide validation and UI affordances without forcing every entry into a rigid form.

### Theme

`Theme` represents a recurring area of attention or meaning.

Likely fields:

- `id`
- `slug`
- `name`
- `description`
- `parentThemeId`
- `status`
- `metadata`

Themes can support hierarchy lightly, but the system should not require a full ontology.

### Project

`Project` represents a concrete creative, technical, study, or research effort.

Projects connect entries, decisions, questions, references, and summaries. Examples include `personal-context-system`, `detective`, `sanatana-kalender`, `knowledge-base`, MSc work, and AI workflow experiments.

### Question

`Question` deserves first-class treatment because active questions are one of the highest-value AI context surfaces.

Statuses:

- `open` — captured and worth tracking, but not currently being worked
- `active` — currently being investigated, answered, or used to drive work
- `parked` — still valid, intentionally deferred
- `answered` — resolved enough to serve as settled context
- `reframed` — superseded by a clearer question
- `abandoned` — no longer useful enough to keep active

A question can originate from an entry, belong to themes/projects, and link to entries that answer, complicate, or reframe it.

Question workflow rule: `Entry.type = "question"` is the capture form of a tracked `Question`. Creating a question entry creates and links one first-class `Question` through a unique origin relation. Existing entries can be promoted explicitly from the entry detail page; promotion changes the entry type to `question`, creates or repairs the origin `Question`, and keeps the origin entry linked. `open_loop` stays separate: it is for unresolved thoughts or actions that need closure but are not yet framed as tracked questions.

### Thread

`Thread` is a curated sequence of entries around a continuing line of thought. It is useful when a topic becomes more than a tag but less than a formal project.

### Relationship

Relationships connect domain objects while keeping graph complexity controlled.

Recommended fields:

- `fromType`
- `fromId`
- `toType`
- `toId`
- `relationType`
- `note`
- `createdAt`

Suggested relation types:

- `relates_to`
- `mentions`
- `expands`
- `contradicts`
- `supports`
- `questions`
- `answers`
- `reframes`
- `part_of`
- `inspired_by`
- `external_reference`

`Reference` records are the primary way to store external material. The `external_reference` relation type is reserved for explicit links from internal objects to external app/database records when the richer `Reference` object is not the right fit.

The graph/map view should emerge from explicit links; it should not become the primary editing model too early.

### Attachment

Attachments are files with database metadata.

Examples:

- screenshots
- PDFs
- exported AI conversations
- images
- audio notes
- source documents

Track path, media type, checksum, size, title, description, and related domain objects.

### Source

`Source` is a first-class model for Sanatana knowledge sources. It is distinct from `Reference`, which is a lightweight external link. A Source has a fixed type, structured type-specific metadata, and connects to both themes and entries.

SourceType enum (immutable after creation):

- `video` — YouTube or other video content
- `book` — physical or digital book
- `post` — article, blog post, online text
- `image` — visual source (deity images, artwork, diagrams)
- `sadhana` — practice or ritual context
- `upadesha` — teaching or discourse
- `stotra` — hymn or devotional text
- `deity_concept` — conceptual record for a deity form
- `teacher` — teacher, lineage holder, or commentator

Each source type has a discriminated Zod metadata schema in `src/domain/context.ts`. The `metadata` JSONB field stores type-specific data (e.g., `authorName`, `publishYear`, `youtubeUrl`, `mantras`). A derived `searchText` column is populated by `metadataToSearchText()` to make JSONB fields queryable via full-text search.

Sources connect to themes via `SourceTheme` junction (replacing the separate KB ItemDeity/Tradition/Topic/Tag joins) and to entries via `EntrySource` junction.

### Theme (Taxonomy-as-Theme)

Sanatana taxonomy categories (deity, tradition, topic, tag) are stored as `Theme` records with `metadata.category`. This avoids separate Deity/Tradition/Topic tables while enabling category-filtered views.

Theme hierarchy uses `parentThemeId`. A cycle guard in the repository (BFS ancestor walk) prevents circular parent references before any `setThemeParent` call.

### Reference

References are lightweight pointers to external material such as URLs, books, films, games, articles, repositories, or records in external apps.

The system should support references without becoming a full bibliography manager.

## Data Modeling Strategy

Use a hybrid schema:

- Stable, commonly queried fields become relational columns.
- Flexible type-specific fields live in `metadata` JSONB.
- Zod schemas validate metadata per entry type where useful.
- Prisma models define durable structure and migrations.

Important indexes:

- entry `type`
- entry `capturedAt`
- entry `occurredAt`
- entry `status`
- theme/project/question slugs
- relationship endpoints
- GIN full-text index on Entry (title + summary + body) via `to_tsvector('simple', ...)`
- GIN full-text index on Source (title + searchText) via `to_tsvector('simple', ...)`
- JSONB indexes only where query patterns justify them

Full-text search uses PostgreSQL `tsvector` with the `simple` dictionary (no language stemming). Source metadata is flattened into the `searchText` column by `metadataToSearchText()` so JSONB fields participate in FTS without a JSONB index.

## Write Path

All mutations follow one path:

```txt
UI / CLI / future MCP tool
  -> application command
  -> Zod validation
  -> domain rules
  -> repository interface
  -> Prisma transaction
  -> optional projection rebuild or invalidation
```

File projections are generated after durable writes. Generated files are not edited by hand.

## Read Path

Reads are split by purpose:

- UI reads: typed application queries for screens and interactions.
- AI context reads: context builders optimized for usefulness and compactness.
- Search reads: text and filter retrieval.
- Maintenance reads: debugging, export, backup, and projection inspection.

## Context Mirror

`data/context-mirror` is a deterministic generated projection of selected database state.

Planned structure:

```txt
data/context-mirror/
  manifest.json
  ai-index.md
  today.md
  ai-bundle.md
  bundles/
    local-full.md
    shareable-only.md
    projects/{slug}.md
    questions/{id}.md
  recent.md
  question-queue.md
  projects/
  themes/
  entries/
  threads/
    {slug}.md
  timeline/
    entries.md
    shareable.md
```

The mirror should include:

- stable generated paths
- source IDs
- generation timestamp
- concise summaries
- related object links
- enough metadata for AI filtering

The mirror should not include:

- secrets
- raw private attachments by default
- every internal database field
- generated speculation presented as fact

Markdown is for human and AI reading. JSON is for scripts, tests, future MCP resources, and deterministic tooling.

## AI Access Model

Recommended progression:

1. Generated context mirror.
2. Helper CLI over generated context and application queries.
3. Read-only database user or local query helper.
4. MCP server exposing resources and validated tools.
5. Optional in-app AI chat.

The MCP server is an adapter, not the architectural core. It should call the same application services and context builders as the UI and CLI.

Possible MCP resources:

- `pcs://today`
- `pcs://theme/{slug}`
- `pcs://project/{slug}`
- `pcs://question-queue`
- `pcs://entry/{id}`

Possible MCP tools:

- `search_entries`
- `get_context`
- `create_observation`
- `link_objects`
- `summarize_thread`

AI write access should remain explicit, validated, and auditable.

## Future CLI

The CLI supports terminal and external AI workflows.

Read commands:

```txt
pcs context today
pcs context topic <slug>
pcs context project <slug>
pcs context questions
pcs search <query>
pcs entry show <id>
pcs mirror status
```

Maintenance command:

```txt
pcs mirror rebuild
```

Later write commands:

```txt
pcs capture observation
pcs capture question
pcs link <from> <relation> <to>
```

Non-interactive commands are preferred for AI/tool use.

## Search And Retrieval

Start with PostgreSQL search:

- full-text search over entries
- filtering by type/status/date/theme/project
- saved filters for repeated command-center queries
- trigram similarity later if fuzzy matching becomes valuable

Embeddings and vector search are deferred. If added later, store embeddings separately, record provider/model/version, make re-embedding explicit, and never make embeddings the only retrieval mechanism.

## UI Information Architecture

Recommended routes:

```txt
/
/capture
/ledger
/cabinet
/command
/entries/[id]
/themes/[slug]
/projects/[slug]
/questions/[id]
/threads/[slug]
/settings
/map          (deferred — after Cabinet is stable and relationship data exists)
```

Primary screens:

- Dashboard: today, question queue, current projects, recent entries, and current counts.
- Capture: fast entry creation with type, title/body, themes, project, and occurred date.
- Ledger: chronological thinking stream with filters.
- Cabinet: structured browsing by entry type/status, theme, project, question, thread, and archived entries.
- Command: context builder, projection status, saved searches, and AI export surfaces.
- Map: relationship exploration, secondary to cabinet/ledger. Deferred.

First build surface: Dashboard, Capture, Ledger, and Entry detail.

## UI Direction

Use a restrained professional interface:

- dense but calm layouts
- excellent filtering and scanning
- keyboard-friendly capture
- clear empty states
- type/status badges with limited color use
- stable navigation between entries, themes, projects, questions, and threads

Avoid a marketing-site feel, diary-toy feel, or generic admin-panel feel.

When implementation starts, use Context7 or official documentation lookup for current framework/library guidance before locking in details that may have changed.

## Local Operation

Recommended setup:

- Next.js app running locally.
- PostgreSQL via local service or Docker Compose.
- Prisma migrations committed once implementation starts.
- `data/context-mirror` generated locally and ignored by default.
- `data/attachments` and `data/exports` excluded from source control by default.

Docker Compose is useful from the start if it reduces setup friction. It should not hide how the system works.

## Privacy And Safety

Defaults:

- no external telemetry
- no cloud sync
- no public deployment assumption
- no AI provider calls without explicit configuration
- conservative context mirror privacy policy
- documented backup process before daily-use dependence

Simple local authentication can be added later. The first real security boundary is the local machine and filesystem.

## Backups And Export

Minimum backup surfaces:

- PostgreSQL dump
- `data/attachments`
- schema and migration history

Generated context mirror can be rebuilt, but may be included in backups for convenience.

Useful export formats:

- full JSON export
- markdown export by date/theme/project
- compact AI context bundle

Exports should preserve source IDs.

## External Project Boundaries

### detective

`detective` owns structured external-world investigations.

This system may store Gerald's reflections, active questions, links to detective records, and copied summaries with provenance. It should not store canonical people/org/event/source graphs, investigation datasets, or evidence boards as primary data.

### knowledge-base and sanatana-kalender

`sanatana-kalender` owns Sanatana calendar and practice mechanics. That boundary is stable.

`knowledge-base` is being migrated into this system. Sanatana sources (books, videos, teachings, deity records) and taxonomy (deities, traditions, topics) now live here as `Source` and `Theme` records. Migration scripts live in `scripts/`:

- `seed-kb-taxonomy.ts` — migrates KB Deity/Tradition/Topic/Tag to PCS Themes with `metadata.category`; sets hierarchy and Relationship records for deity-tradition links
- `import-kb-items.ts` — migrates KB Items to PCS Sources; links to themes via slug; stores `kbId` in metadata for idempotency

Both scripts are idempotent and target the PCS database. The KB Docker Compose `db` service must be running for migration.

## Testing Strategy

Focus testing where mistakes would damage trust:

- domain validation for entry types and relationships
- application service tests for create/update/link workflows
- repository integration tests around Prisma transactions
- projection tests for generated markdown/json shapes
- search tests for expected retrieval behavior
- UI smoke tests for capture, ledger, cabinet, and command surfaces

Generated context is product behavior and should be tested.

## Implementation Sequence

This is not an MVP-only design, but implementation still needs order.

1. [done] Scaffold TypeScript, Next.js, Tailwind, Prisma, Zod, and the folder structure.
2. [done] Define the first Prisma schema for entries, themes, projects, questions, threads, relationships, references, and attachments.
3. [done] Build domain schemas and application services for capture, update, link, and query.
4. [done] Build Dashboard, Capture, Ledger, and Entry detail.
5. [done] Add Cabinet views for themes, projects, and questions.
6. [done] Add context mirror generation with markdown and JSON projections.
7. [done] Add search and saved filters. Full-text search, structured filters, persisted saved filters, and Command Center saved-filter links exist.
8. [done] Complete Command Center for context building and mirror inspection.
9. [todo] Add CLI adapter over context/query services.
10. [done] Add graph/map view once relationship data exists.
11. [todo] Add MCP adapter when the core domain and context services are stable.

## Current State

Last updated: 2026-05-26

**Built:**

- Full Prisma schema including Entry, Theme, Project, Question, Thread, Reference, Attachment, Relationship, SavedFilter, Source, SourceTheme, EntrySource, and all explicit join tables.
- Layered source structure: `src/domain`, `src/application`, `src/repositories`, `src/infrastructure`, `src/ai-context`, `src/app`, `src/components`.
- Domain validation and application services for entry capture/update, question status update, object linking, reference/attachment metadata, thread creation, list/query reads, graph reads, context mirror snapshots, and source CRUD.
- UI routes for Dashboard, Capture, Ledger, Cabinet, Entry detail/edit, Command Center, Settings, Map, Sources list/detail/form, and detail views for themes, projects, questions, and threads.
- Entry capture/edit fields use centralized taxonomy labels for entry types. Question entries create tracked Questions automatically, and entry detail can promote an existing entry into the question workflow.
- Dashboard and Cabinet use different read models: Dashboard stays focused on current context, while Cabinet is the structured archive with entry type/status counts, truly archived entries, and source counts per type.
- Relationship creation from entry and question detail pages uses selectable targets including sources.
- Ledger filters can be persisted as named saved filters and reused from both Ledger and Command Center. System filters remain available as starter shortcuts.
- Context mirror generation for `manifest.json`, `ai-index.md`, `today.md`, `ai-bundle.md`, context bundle variants, `recent.md`, `question-queue.md`, project/theme indexes and pages, thread detail pages, timeline pages, `entries/index.json`, per-entry Markdown/JSON files, `sources/index.md`, `sources/index.json`, per-type source indexes, per-source Markdown files, and `sanatana/taxonomy.md`.
- Local backup and restore scripts for the Docker Compose PostgreSQL database and `data/attachments`.
- Source model with SourceType enum (9 types), discriminated Zod metadata schemas, `searchText` column for FTS, and GIN indexes on Entry and Source.
- Theme cycle guard (BFS ancestor walk) preventing circular parent hierarchy.
- KB migration scripts: `seed-kb-taxonomy.ts` and `import-kb-items.ts`.
- Taxonomy-as-Theme: KB Deity/Tradition/Topic/Tag stored as Theme records with `metadata.category`.
- Map page Sanatana knowledge section: deities, traditions, topics by category, sources per type.

**Not yet built:**

- Richer relationship validation and resolved relationship labels in read views.
- Richer privacy/export policies beyond the current shareable-only bundle and timeline.
- Automated backup scheduling and off-machine backup storage.
- CLI adapter.
- Graph/map visual layout beyond the current text-first relationship map.
- MCP adapter.
- KB deletion gate (verify PCS fully replaces KB before removing knowledge-base app).

## Detailed Design Artifacts

The canonical detailed design is split across:

- `docs/DATA-MODEL.md`
- `docs/UI-IA.md`
- `docs/AI-CONTEXT.md`
- `docs/LOCAL-OPERATION.md`
- `docs/ENGINEERING.md`

Use this document for the system-level shape. Use the focused documents for implementation rules, data-field details, UI flows, local operations, and AI projection behavior.
