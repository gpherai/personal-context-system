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

PCS draait lokaal standaard op `http://localhost:3001`. Elke app in deze workspace heeft een vaste poort, zodat de opstartvolgorde geen poort bepaalt. Alleen voor een bewust tijdelijk tweede exemplaar kun je overriden met bijvoorbeeld `PORT=4011 npm run dev`; zet `PORT` niet in `.env`, want Next.js leest die waarde voordat env-bestanden geladen zijn.

Useful commands:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run check` — typecheck + lint + test + build
- `npm run mirror:build` — rebuild the AI-readable context mirror
- `npm run db:studio` — Prisma Studio
- `npm run db:seed`
- `npm run pcs` — context CLI (`tsx scripts/pcs.ts`)
- `npm run import:chatgpt` — import a ChatGPT export into Sources
- `npm run backup:create` / `npm run backup:restore` — local backup of canonical data
