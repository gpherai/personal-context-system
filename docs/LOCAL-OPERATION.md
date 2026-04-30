# Local Operation

Updated: 2026-04-30

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
- `data/backups/`
- database dumps

## Backup

Create a local backup:

```bash
npm run backup:create
```

The backup is written under `data/backups/<timestamp>/` and includes:

- `database.dump`: PostgreSQL custom-format dump from the local Docker Compose database
- `attachments.tar.gz`: only when `data/attachments` exists
- `README.md`: backup notes and exclusions

The backup deliberately does not include `.env`. Store `.env` separately in a password manager or another secure location outside git. The generated context mirror is not backed up because it can be rebuilt:

```bash
npm run mirror:build
```

Restore a backup into the local database:

```bash
npm run backup:restore -- data/backups/<timestamp>
```

Restore is destructive for the local database because it runs `pg_restore --clean --if-exists`. Confirm the target database before using it. Migrations remain tracked in git and are the schema history; backups are for local data recovery.

## Troubleshooting

If the app shows a database setup notice:

1. Confirm Docker is running.
2. Run `docker compose ps`.
3. Confirm `.env` contains `DATABASE_URL`.
4. Run `npm run db:generate`.
5. Run `npm run db:migrate`.

If Prisma commands cannot find the database URL, check `prisma.config.ts` and `.env`.
