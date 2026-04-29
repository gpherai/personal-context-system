# Data Model

Updated: 2026-04-29

## Purpose

This document defines the canonical data model for the first build. PostgreSQL is the source of truth. Markdown and JSON files are generated projections, not editable storage.

## Modeling Principles

- Store personal context as first-class durable records, not as loose blobs only.
- Keep `Entry` central because daily capture is the main write path.
- Promote recurring concepts into first-class records only when they need navigation, status, or relationships.
- Use generic relationships carefully; the graph is useful but should not dominate the editing model.
- Preserve provenance and timestamps so future AI context is auditable.

## Core Objects

### Entry

Purpose: the main capture unit.

Fields:

- `id`
- `type`
- `status`
- `title`
- `body`
- `summary`
- `source`
- `confidence`
- `privacyLevel`
- `occurredAt`
- `capturedAt`
- `createdAt`
- `updatedAt`
- `metadata`

Initial types:

- `observation`
- `question`
- `insight`
- `suspicion`
- `reflection`
- `open_loop`
- `decision`
- `project_note`
- `media_note`
- `event_reflection`
- `practice_note`
- `ai_conversation_note`

Initial statuses:

- `active`
- `archived`
- `draft`

### Theme

Purpose: recurring area of attention or meaning.

Fields:

- `id`
- `slug`
- `name`
- `description`
- `status`
- `parentThemeId`
- `metadata`
- timestamps

Themes may be hierarchical, but the hierarchy should stay optional.

### Project

Purpose: concrete creative, technical, study, or research effort.

Fields:

- `id`
- `slug`
- `name`
- `description`
- `status`
- `metadata`
- timestamps

Projects connect notes, decisions, questions, references, and generated context.

### Question

Purpose: active thinking surface for unresolved or reframed questions.

Fields:

- `id`
- `prompt`
- `status`
- `summary`
- `originEntryId`
- `metadata`
- timestamps

Question statuses:

- `open`
- `active`
- `parked`
- `answered`
- `reframed`
- `abandoned`

### Thread

Purpose: curated sequence around a continuing line of thought.

Fields:

- `id`
- `slug`
- `title`
- `description`
- `status`
- `metadata`
- timestamps

### Relationship

Purpose: explicit links between objects.

Fields:

- `id`
- `fromType`
- `fromId`
- `toType`
- `toId`
- `relationType`
- `note`
- `createdAt`

Object types:

- `entry`
- `theme`
- `project`
- `question`
- `thread`
- `reference`
- `attachment`

Relation types:

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

### Reference

Purpose: lightweight pointer to external material.

Fields:

- `id`
- `kind`
- `title`
- `url`
- `description`
- `metadata`
- timestamps

References can point to URLs, books, films, games, repositories, or external app records.

### Attachment

Purpose: file metadata for screenshots, PDFs, exports, images, audio, and source documents.

Fields:

- `id`
- `path`
- `mediaType`
- `checksum`
- `sizeBytes`
- `title`
- `description`
- `metadata`
- timestamps

Attachment bytes live under `data/attachments` by default and are not committed.

## Join Models

Use explicit join tables instead of implicit many-to-many relations so links can gain metadata later.

- `EntryTheme`
- `EntryProject`
- `EntryQuestion`
- `EntryThread`
- `EntryReference`
- `EntryAttachment`

Each join has at least:

- source id
- target id
- `createdAt`

Thread membership also stores `position`.

## Index Strategy

Required from the start:

- `Entry.type`
- `Entry.status`
- `Entry.capturedAt`
- `Entry.occurredAt`
- theme/project/thread slug uniqueness
- question status
- relationship endpoint pairs
- relationship relation type
- join table composite keys

Full-text search should be added with PostgreSQL search once the basic schema is stable. Vector search remains deferred.

## Privacy Levels

Initial privacy levels:

- `private`
- `sensitive`
- `shareable`

Default is `private`. Context mirror builders must exclude or redact sensitive records unless explicitly configured.

## Generated Projections

`data/context-mirror` is generated from database state.

Rules:

- generated files include source IDs
- generated files include generation metadata
- generated Markdown is optimized for reading
- generated JSON is optimized for scripts and future MCP resources
- generated files can be deleted and rebuilt
- generated files are ignored by git by default

## Prisma Mapping

Use Prisma models that correspond directly to the objects above. Keep model names singular and relation join models explicit. Use JSON fields for `metadata`; promote fields to columns only when they become common query or validation concerns.
