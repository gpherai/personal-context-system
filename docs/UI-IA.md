# UI Information Architecture

Updated: 2026-04-30

## Purpose

This document defines the first usable interface. The app should feel like a professional private workbench for thinking, not a marketing site, toy diary, or generic admin template.

## Design Direction

The local `ui-ux-pro-max` design-system pass recommended a minimal Swiss-style productivity interface:

- neutral base
- high-contrast typography
- restrained blue primary action
- dense but calm layouts
- strong search and navigation
- semantic HTML and visible focus states

Because this is a private knowledge tool, the implementation should avoid external decorative imagery and prioritize information density, scanning, and predictable workflows.

## Primary Navigation

Routes:

- `/` Dashboard
- `/capture` Capture
- `/ledger` Ledger
- `/cabinet` Cabinet
- `/command` Command Center
- `/settings` Settings
- `/entries/[id]` Entry detail
- `/themes/[slug]` Theme detail
- `/projects/[slug]` Project detail
- `/questions/[id]` Question detail
- `/threads/[slug]` Thread detail
- `/map` Graph/map view — deferred; built after Cabinet is stable and relationship data exists

First implementation surfaces:

- Dashboard
- Capture
- Ledger
- Cabinet
- Entry detail
- Entry edit
- Question workflow
- Thread detail
- Command Center
- Settings with local operation, mirror, privacy, and backup cues

## Dashboard

Purpose: current personal context at a glance.

Content:

- quick capture link
- recent entries
- question queue
- active projects
- active themes
- context mirror status
- setup warning if the database is unavailable

The dashboard should not become a decorative hero page. The first viewport should show useful state.

## Capture

Purpose: low-friction entry creation.

Fields:

- type
- title
- body
- summary
- occurred date
- status
- privacy level
- source
- confidence
- theme names
- project names

Behavior:

- validate on submit at the server boundary
- keep fields stable and keyboard-friendly
- redirect to entry detail after successful creation
- create missing themes/projects by slug where appropriate
- selecting `Question` creates a tracked Question automatically
- selecting `Open loop` keeps the entry as an unresolved thought/action without creating a tracked Question

## Ledger

Purpose: chronological thinking stream.

Controls:

- search query
- type filter
- status filter
- privacy filter

List item content:

- title
- summary or body excerpt
- type/status/privacy badges
- captured/occurred date
- linked themes/projects where available

## Cabinet

Purpose: structured browsing.

Sections:

- entries by type/status
- themes
- projects
- questions
- threads

This is the archive/cabinet mode. It should support scanning and later deeper filters.

## Entry Detail

Purpose: inspect one captured object.

Content:

- title, type, status, privacy
- body and summary
- timestamps
- linked themes/projects/questions/references/attachments
- relationship list
- source/provenance metadata

Editing can be added after capture and read flows are stable.

Current state: editing is available for entry core fields, status, privacy, themes, and projects. Relationship, reference, attachment, and thread creation start from the entry detail page. Relationship creation uses selectable targets for entries, questions, projects, and themes. Thread, reference, and attachment relationship targets are still future picker scope.

Entry detail exposes a promote action for entries that should become tracked questions. Question entries link back to their tracked Question, and Question detail links back to the origin entry when available.

## Question Workflow

Purpose: track questions that deserve lifecycle state, linked evidence, and AI context.

Status meanings:

- `open`: captured and worth tracking, but not currently being worked
- `active`: currently being investigated, answered, or used to drive work
- `parked`: still valid, intentionally deferred
- `answered`: resolved enough to serve as settled context
- `reframed`: superseded by a clearer question
- `abandoned`: no longer useful enough to keep active

UI rule: use concise helper text near the type/status controls, not long explanatory prose. Dashboard and map surfaces should refer to the mixed open/active/parked set as the question queue rather than only "open questions".

## Command Center

Purpose: AI/context operations.

First features:

- show context mirror output path
- rebuild context mirror
- show recent generated files if available
- explain privacy defaults through concise labels, not long in-app prose

Current state: the Command Center can rebuild the mirror, show mirror status, list generated files, and expose system context filters.
User-defined saved context filters are persisted from the Ledger and shown in Command Center alongside the system filters.

Later features:

- compact bundle generation
- CLI status
- future MCP resource inspection

## Responsive Behavior

- Use a sidebar on desktop and top navigation on narrow screens.
- Keep forms single-column on mobile.
- Maintain stable heights for buttons, inputs, badges, and navigation items.
- Avoid horizontal scroll at 375px.
- Use semantic landmarks: header, nav, main, section.
- Include a skip-to-content link.

## Accessibility Rules

- All controls use semantic buttons, links, inputs, selects, and textareas.
- Every form control has a label.
- Focus states remain visible.
- Color is not the only status indicator.
- Icon-only buttons require accessible names.
- Motion should be subtle and compatible with `prefers-reduced-motion`.

## Visual System

Initial tokens:

- background: warm near-white
- surface: white
- text: near-black
- muted text: zinc/slate range with enough contrast
- primary: blue
- accent: teal
- caution: amber
- danger: red

Use cards only for repeated records, modals, and genuinely framed tools. Do not place page sections inside decorative floating cards.
