# Local Operation

Updated: 2026-04-29

## Purpose

This document explains how to run, inspect, and maintain the app locally on the Fedora/Incus development VM.

## Requirements

Current local baseline:

- Node.js `v25.9.0`
- npm `11.12.1`
- Docker `29.4.1`
- Git

pnpm is not installed, so npm is the default package manager.

## Environment

Copy the example environment:

```bash
cp .env.example .env
```

Default local database:

```txt
postgresql://pcs:pcs@localhost:54329/personal_context_system
```

The `.env` file is local-only and must not be committed.

## Database

Start PostgreSQL:

```bash
docker compose up -d db
```

The Compose file uses the PostgreSQL 18 image and mounts the volume at `/var/lib/postgresql`, which is required by the current Docker image layout.

Generate Prisma client:

```bash
npm run db:generate
```

Create/apply migrations:

```bash
npm run db:migrate
```

Open Prisma Studio:

```bash
npm run db:studio
```

## App Commands

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

When opening the dev server through the Incus VM network address, Next.js needs that host in `allowedDevOrigins`. The current VM address is configured in `next.config.ts`.

Quality checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Build context mirror:

```bash
npm run mirror:build
```

## Data Locations

Tracked source:

- `src/`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `docs/`

Ignored local data:

- `.env`
- `.next/`
- `node_modules/`
- `data/context-mirror/`
- `data/attachments/`
- `data/exports/`
- database dumps

## Backup

Before depending on the app daily, add a backup routine for:

- PostgreSQL dump
- `data/attachments`
- `.env` stored securely outside git
- committed schema and migrations

Generated context mirror can be rebuilt and is not a primary backup target.

## Troubleshooting

If the app shows a database setup notice:

1. Confirm Docker is running.
2. Run `docker compose ps`.
3. Confirm `.env` contains `DATABASE_URL`.
4. Run `npm run db:generate`.
5. Run `npm run db:migrate`.

If Prisma commands cannot find the database URL, check `prisma.config.ts` and `.env`.
