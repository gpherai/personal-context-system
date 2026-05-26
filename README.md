# Personal Context System

Personal Context System is a private single-user application for capturing, structuring, connecting, and using Gerald's personal context with AI.

The app is built local-first with Next.js, PostgreSQL, Prisma, Zod, Tailwind CSS, and generated AI-readable context projections.

**Scope (2026-05-26):** PCS now also serves as the canonical store for Sanatana knowledge sources and taxonomy (books, videos, teachings, deities, traditions, topics). The `knowledge-base` app has been migrated and removed.

See:
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/ENGINEERING.md`
- `docs/DATA-MODEL.md`
- `docs/UI-IA.md`
- `docs/AI-CONTEXT.md`
- `docs/LOCAL-OPERATION.md`

## Local Start

```bash
npm install
cp .env.example .env
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run dev
```

Useful commands:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run mirror:build`

## Sanatana KB Migration

One-time scripts to seed taxonomy and import sources from the old `knowledge-base` DB (requires KB Docker `db` service running):

```bash
# 1. Migrate taxonomy (deities, traditions, topics, tags → Themes + Relationships)
npx tsx scripts/seed-kb-taxonomy.ts

# 2. Import items → Sources (idempotent, keyed on kbId in metadata)
npx tsx scripts/import-kb-items.ts
```

Both scripts are idempotent. KB DB connection: `postgresql://gerald:dev_kb_2026@localhost:5433/sanatana_kb`.
