# Personal Context System

Personal Context System is a private single-user application for capturing, structuring, connecting, and using Gerald's personal context with AI.

The app is built local-first with Next.js, PostgreSQL, Prisma, Zod, Tailwind CSS, and generated AI-readable context projections.

See:
- `docs/ARCHITECTURE.md`
- `docs/ENGINEERING.md`
- `docs/DATA-MODEL.md`
- `docs/UI-IA.md`
- `docs/AI-CONTEXT.md`
- `docs/LOCAL-OPERATION.md`
- `docs/ARCHITECTURE-BRAINSTORM.md`
- `docs/DECISIONS.md`

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
