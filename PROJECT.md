---
name: personal-context-system
silo: internal
status: stalled
stack: 'Next.js 16.2.4, TypeScript 6, Prisma 7, PostgreSQL, Zod 4, Tailwind CSS 4, Vitest'
business_value: 'Event-sourcing van persoonlijke context: capture, ledger, cabinet, map en command center. Levensdagboek en AI-geheugen in één systeem.'
last_ai_tool: ''
last_ai_date: ''
---

## Current State

Architectuur en schema volledig uitgewerkt (13 entiteiten + junction tables). Alle hoofdroutes geïmplementeerd (entries, questions, themes, projects, threads, cabinet, ledger). Context mirror generator schrijft AI-leesbare projecties naar data/context-mirror/. TypeScript compileert zonder fouten, 4 tests groen. Bouwstatus onzeker — eerdere buildfouten gemeld maar code lijkt intact. Verificatie vereist voor verdere ontwikkeling.

## Open Todos

- [ ] Bouw verifiëren: npm run build uitvoeren na prisma generate
- [ ] Context mirror integreren in buildpipeline (nu handmatig via npm run mirror:build)
- [ ] Bijlage-opslag implementeren (Attachment model bestaat maar geen storage adapter)
- [ ] Relatiequery's en graaftraversal implementeren
- [ ] Testdekking uitbreiden voor application services
- [ ] Backup/restore workflow testen en documenteren

## AI Session Log

| Datum | Tool | Samenvatting |
|-------|------|-------------|

## Recent Git Activity

## Notities

Gelaagde architectuur: domain naar application naar repositories naar infrastructure naar UI. Server Actions voor alle mutaties. Context mirror output is git-ignored — opnieuw genereren na schemawijzigingen via npm run mirror:build. Bewust geen agenda, gewoontes of taakbeheer — scope beperkt tot persoonlijke context en reflectie. Single-user, geen auth. Lokale operatie gedocumenteerd in docs/LOCAL-OPERATION.md.
