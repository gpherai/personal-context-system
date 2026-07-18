# ChatGPT-gesprekken bruikbaar maken als kennisbron

## Context

De ChatGPT-export is geïmporteerd als 401 `Source`-records van type `conversation`. Daarmee staat het materiaal in de DB, maar het is een dood eindpunt: er is geen manier om er iets uit te halen en aan het systeem te koppelen. Concreet ontbreekt:

- **Entry ↔ Source-koppeling.** `EntrySource` staat in `prisma/schema.prisma` en `linkEntryToSource()` bestaat in `src/infrastructure/database/prisma-context-repository.ts:1548`, maar er is geen command-schema, geen server action en geen UI. `createEntryCommandSchema` (`src/domain/context.ts:90`) kent geen `sourceIds`. Een insight uit een gesprek kan dus niet naar dat gesprek verwijzen.
- **Citeerbare eenheid.** Een gesprek is één blob (`Source.body` + `metadata.messages`). Er is geen manier om naar een specifieke passage te verwijzen.
- **Schaal.** 100 gesprekken uit één exportbestand = ~2,7M tekens ≈ 680k tokens. Mediaan 8k tekens, p90 72k, grootste 408k (~100k tokens in één gesprek). Alle 401 samen ruim boven de 2M tokens. Je kunt dit niet browsen door bestanden te lezen — je hebt selectie op berichtniveau nodig.

Doel: in de CLI met een AI over deze gesprekken kunnen praten en er Entries + citaten uit destilleren, handmatig, gesprek voor gesprek.

## Wat de export bevat — gebruikt vs. ongebruikt

Gemeten op `conversations-003.json` (100 gesprekken, 2412 mapping-nodes).

### Wordt nu gebruikt
`conversation_id`, `id`, `title`, `create_time`, `update_time`, `default_model_slug`, en uit `mapping`: alleen nodes met `author.role` ∈ {user, assistant} én `content.content_type === "text"` én alle `parts` strings.

### Wordt nu weggegooid

**Gespreksniveau:** `is_archived`, `is_starred`, `pinned_time`, `is_study_mode`, `is_do_not_remember`, `memory_scope`, `current_node`, `conversation_template_id`, `plugin_ids`, `voice`, `is_read_only`.

**Structuur (correctheidsprobleem, niet alleen gemis):** `mapping[].parent` en node-ids. Een gesprek is een *boom*, geen lijst — 7 van de 100 gesprekken hebben vertakkingen (regeneraties/edits). `parseChatGptConversation()` platslaat alle nodes gesorteerd op `create_time`, dus verlaten takken worden door het actieve gesprek heen gemengd. `current_node` + parent-keten geeft het werkelijke pad.

**Berichtniveau:** `message.id` (nodig om te citeren), `metadata.model_slug` (per bericht — gesprekken lopen over gpt-5-2 t/m gpt-5-5), `metadata.content_references` (**1590 stuks in 100 gesprekken** — web-citaties met URLs, direct bruikbaar als `Reference`-records), `metadata.attachments` (48), `metadata.code_blocks`, `metadata.search_result_groups`, `image_results`, `async_task_title`, `automation_title`, `targeted_reply_label`.

**Content-types die volledig verdwijnen:** `thoughts` (884 nodes), `reasoning_recap` (238), `multimodal_text` (15, bevat `image_asset_pointer` → verwijst naar de `file-*.dat`-assets en `conversation_asset_file_names.json` in de zip).

Oordeel: `thoughts`/`reasoning_recap` terecht weggelaten (ruis, halveert het volume). `content_references`, `message.id`, per-bericht `model_slug`, de boomstructuur en `is_starred`/`is_archived` zijn wél waardevol en moeten mee.

## Aanpak

### Fase 1 — Berichten als eersteklas records

Berichten verhuizen van JSON-blob naar een echte tabel. Dat lost drie dingen tegelijk op: citeerbaarheid, zoeken op berichtniveau, en het mirror-volume.

Nieuw in `prisma/schema.prisma`:

```prisma
model SourceMessage {
  id         String   @id @default(cuid())
  sourceId   String
  externalId String?  @db.VarChar(80)   // ChatGPT message uuid
  position   Int                        // volgorde in actieve pad
  role       String   @db.VarChar(20)
  text       String   @db.Text
  model      String?  @db.VarChar(120)
  occurredAt DateTime? @db.Timestamptz(6)
  metadata   Json     @default("{}")    // urls, attachments, codeBlocks
  source     Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  excerpts   SourceExcerpt[]
  @@unique([sourceId, position])
  @@index([sourceId])
}
```

Aanpassingen aan `src/domain/chatgpt-export.ts`:
- Actief pad reconstrueren via `current_node` + `parent`-keten in plaats van sorteren op `create_time`. Off-path berichten overslaan.
- Per bericht `id`, `metadata.model_slug`, en URLs uit `metadata.content_references` meenemen.
- Gespreksniveau: `isArchived`, `isStarred`, `pinnedTime`, `isStudyMode`, afgeleide `models[]`, `charCount`.
- Tests uitbreiden in `src/domain/chatgpt-export.test.ts`: vertakking, ontbrekende `current_node`, lege parts.

`scripts/import-chatgpt-export.ts` wordt herbruikbaar:
- Zip-pad als CLI-argument, `conversations-*.json` auto-detecteren (nu 5 hardcoded namen).
- Upsert op `conversationId` in plaats van skip, zodat gegroeide gesprekken bijwerken en de 401 bestaande records gebackfilld worden met berichten en nieuwe metadata.
- `Source.body` blijft staan voor full-text fallback; `metadata.messages` vervalt (berichten staan nu in de tabel).

### Fase 2 — Excerpt + Entry-koppeling

```prisma
model SourceExcerpt {
  id        String   @id @default(cuid())
  sourceId  String
  messageId String?
  text      String   @db.Text   // exact geciteerde passage
  note      String?  @db.Text   // waarom dit relevant is
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  source    Source         @relation(...)
  message   SourceMessage? @relation(...)
  entries   EntryExcerpt[]
  @@index([sourceId])
}

model EntryExcerpt {
  entryId   String
  excerptId String
  @@id([entryId, excerptId])
}
```

App-laag:
- `createEntryCommandSchema` / `updateEntryCommandSchema` in `src/domain/context.ts` krijgen `sourceIds: string[]` en `excerptIds: string[]`.
- `createExcerptCommandSchema` toevoegen; excerpt-tekst valideren tegen de brontekst van het bericht (voorkomt verzonnen citaten).
- Repository: `linkEntryToSource()` bestaat al en wordt eindelijk aangeroepen; `createExcerpt` / `linkEntryToExcerpt` erbij, plus interface-uitbreiding in `src/repositories/context-repository.ts`.
- UI beperkt tot tonen, geen review-queue: entry-detail (`src/app/entries/[id]/page.tsx`) toont de citaten met link naar het bericht; source-detail (`src/app/sources/[id]/page.tsx`) toont welke Entries eruit voortkwamen.

### Fase 3 — `pcs` CLI

Dit is de werkbank. Over de token-vraag: een CLI die een heel transcript uitprint kost exact evenveel als dat bestand lezen — de winst zit niet in het transport maar in de **selectie**. Daarom is dit een zoek- en schrijfgereedschap, geen viewer. MCP is later een dunne wikkel om dezelfde services; nu niet nodig.

Eén `tsx`-script `scripts/pcs.ts` (eigen `PrismaClient`, zelfde patroon als de import — `server-only` uit `src/infrastructure/database/client.ts` werkt niet buiten Next), via `npm run pcs`:

```
pcs conv list [--starred] [--from 2025-01] [--min-messages 10] [--unmined]
pcs conv search "<query>" [--limit 20]     # treffers op berichtniveau, met context
pcs conv show <id> [--from 12 --to 30]     # bereik van berichten, niet alles
pcs excerpt add <sourceId> --message <n> --text "..." --note "..."
pcs entry add --title ... --type insight --excerpt <id> --theme ...
```

`--unmined` = geen enkele Entry gekoppeld; dat is de triage-status, zonder apart statusveld.

### Fase 4 — Mirror en zoeken

- `buildSnapshot()` in `prisma-context-repository.ts:1240` haalt `listSources({limit: 200})` — met 401 bronnen valt de helft weg. Pagineren of limiet weg.
- `sourceMarkdown()` (`src/ai-context/context-mirror.ts:311`) schrijft de volledige body per bron. Voor conversations alleen kop + metadata + eerste N berichten schrijven, met verwijzing naar `pcs conv show`. Anders wordt de mirror honderden MB's.
- Zoeken: `to_tsvector('simple', ...)` in `findSourceSearchIds` (`:1452`) heeft geen stemming. Vervangen door `'dutch'`/`'english'` config en verplaatsen naar `SourceMessage`, met `ts_headline` voor snippets.

## Verificatie

1. `npm run db:migrate` — migraties voor `SourceMessage`, `SourceExcerpt`, `EntryExcerpt`.
2. `npm run test` — unit-tests voor boomreconstructie (vertakt gesprek levert alleen het actieve pad), excerpt-validatie, en de aangepaste entry-commands.
3. `npm run import:chatgpt docs/chatgptexport099726.zip` op de bestaande DB — verwacht: 401 sources bijgewerkt, 0 duplicaten, berichten-tabel gevuld. Steekproef: een vertakt gesprek in de UI vergelijken met `chat.html` uit de zip.
4. `npm run pcs conv search "<term>"` — treffers op berichtniveau met bron-id en positie.
5. Volledige flow: `pcs excerpt add` → `pcs entry add --excerpt` → entry-detailpagina toont het citaat, source-detailpagina toont de entry.
6. `npm run mirror:build` — controleer dat alle 401 bronnen in `sources/index.json` staan en dat de mirror-map niet explodeert.
7. `npm run check`.

## Volgorde en omvang

Fase 1 en 2 zijn de kern en hangen samen (excerpts hebben berichten nodig). Fase 3 maakt het bruikbaar. Fase 4 is losstaand en kan ertussendoor. Voorstel: 1 → 2 → 3 → 4, met een controlemoment na fase 1 (backfill van 401 gesprekken is de enige stap die bestaande data aanraakt — maak eerst `npm run backup:create`).
