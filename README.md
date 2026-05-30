# Personal Context System

Personal Context System is a private single-user application for capturing, structuring, connecting, and using Gerald's personal context with AI.

The app is built local-first with Next.js, PostgreSQL, Prisma, Zod, Tailwind CSS, and generated AI-readable context projections.

**Scope:** PCS serves as the canonical store for both personal context and Sanatana knowledge sources and taxonomy (books, videos, teachings, deities, traditions, topics). The system has recently been upgraded to an Entity-First data model (2026-05-30) for better topological linking.

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
