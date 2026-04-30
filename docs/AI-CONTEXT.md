# AI Context Model

Updated: 2026-04-30

## Purpose

This document defines how the app exposes context to AI tools while preserving database authority, privacy, and auditability.

## Core Rule

AI reads projections first. AI writes, if enabled later, must go through explicit validated commands.

The generated mirror is a publication surface, not a source of truth.

## Context Mirror

Path:

```txt
data/context-mirror/
```

Initial target files:

- `manifest.json`
- `ai-index.md`
- `today.md`
- `ai-bundle.md`
- `recent.md`
- `question-queue.md`
- `projects/index.md`
- `projects/{slug}.md`
- `themes/index.md`
- `themes/{slug}.md`
- `threads/index.md`
- `entries/index.json`
- `entries/{id}.md`
- `entries/{id}.json`

A `timeline/` directory for time-sequenced entry views is a planned later addition, not part of the initial build.

Current state: the initial target files above are generated. Not yet built: per-thread detail projections, timeline views, and alternate privacy export modes.

Rules:

- write files deterministically
- include source IDs and generation timestamp
- sort records consistently
- keep Markdown readable and compact
- keep JSON stable for scripts and tests
- exclude private generated folders from git

## Privacy Policy

Default inclusion:

- include `private` records in local mirror because the mirror is local and ignored by git
- mark `sensitive` records clearly
- do not include attachment bytes
- do not include secrets
- do not present generated summaries as facts unless source data supports them

Future export modes should allow stricter bundles:

- `local-full`
- `shareable-only`
- `project-scoped`
- `question-scoped`

## Context Builders

Builders should produce specific views:

- today/current context
- recent entries
- question queue
- project context
- theme context
- entry detail
- compact AI prompt bundle

Builders should be pure where possible: receive typed records, return strings/objects, and let filesystem code handle writes.

## Future CLI

Expected commands:

```txt
pcs context today
pcs context project <slug>
pcs context theme <slug>
pcs context questions
pcs search <query>
pcs entry show <id>
pcs mirror rebuild
pcs mirror status
```

The first implementation can expose mirror generation through `npm run mirror:build`. A packaged CLI can follow once the services stabilize.

## Future MCP

MCP remains an adapter over application services and context builders.

Resources:

- `pcs://today`
- `pcs://recent`
- `pcs://question-queue`
- `pcs://project/{slug}`
- `pcs://theme/{slug}`
- `pcs://entry/{id}`

Tools:

- `search_entries`
- `get_context`
- `create_observation`
- `create_question`
- `link_objects`
- `rebuild_context_mirror`

Tool writes must validate input with the same command schemas used by UI and CLI code.

## Testing Expectations

Projection tests should assert:

- manifest shape
- stable entry JSON shape
- Markdown contains source IDs
- open question output filters correctly
- sensitive metadata is marked or excluded according to the selected policy
