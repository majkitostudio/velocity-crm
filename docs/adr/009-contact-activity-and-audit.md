# ADR-009: Contact Activity and Audit

**Stav:** Přijato  
**Datum:** 2026-06-21  
**Schváleno:** 2026-06-21  
**Související:** [ADR-006](./006-contacts-list-and-navigation.md), [ADR-008](./008-csv-contact-import-pipeline.md), [IMPLEMENTATION_SEQUENCE.md](../IMPLEMENTATION_SEQUENCE.md), [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)

## Kontext

Slice 8 dokončil modul Contacts (seznam, detail, ruční vytvoření, CSV import). Historie kontaktu na detailu byla dříve **virtuální read-model** (čtyři paralelní dotazy sloučené v paměti). Od Slice 9 čte timeline výhradně z `ContactActivity` (viz commit 5).

Tento přístup má limity:

- Duplicitní řádky (např. `CALL` + `ORDER` z jednoho call workflow).
- Chybí systémové události (vytvoření kontaktu, změna statusu, import, dokončení callbacku).
- Bez stránkování — načítá se celá historie.
- Neškálovatelné pro velký objem dat (miliony řádků).

Současně `recordAuditEvent` v `src/server/audit.ts` existuje, ale audit záznamy **nepersistuje** (pouze dev log).

Slice 9 zavádí **Contact Activity & Audit** jako dlouhodobý architektonický pattern pro celý Velocity CRM — ne pouze audit databáze, ale kompletní historii všeho, co se s kontaktem stalo.

## Varianty

### Varianta A: Pouze AuditEvent

Jedna tabulka pro vše — audit i timeline.

**Nevýhody:** Audit je lean (`action`, `entityType`, `metadata`) — špatný základ pro bohatou timeline (outcome, totals, grouping). Ne vše v timeline je audit (display-only agregace); naopak ne vše v auditu patří na timeline (login failure, `user.role_changed`). Auth/user události nejsou contact-scoped.

### Varianta B: Pouze ContactActivity

Jedna entita pro historii i compliance.

**Nevýhody:** Auth a user události nejsou contact-scoped. Audit má jiná retenční a GDPR pravidla než UX historie. Riziko úniku citlivých audit dat do operátorského UI.

### Varianta C: Kombinace ContactActivity + AuditEvent (doporučeno)

Dvě oddělené entity s jednotným zápisovým API pro contact-scoped business akce.

**Výhody:** Každá entita optimalizovaná pro svůj účel. Jasné oddělení UX historie a compliance logu. Extensible katalog typů aktivit bez migrace při nových polích display.

## Rozhodnutí

### Kombinace ContactActivity + AuditEvent

| Entita | Účel | Audience |
|--------|------|----------|
| `ContactActivity` | Co se stalo s tímto kontaktem | Operátor, manager, AI reader |
| `AuditEvent` | Kdo co udělal v systému | Compliance, security, admin |

Vztah při zápisu: jedna business akce často vytvoří **1× ContactActivity** + **0–1× AuditEvent** (někdy více auditů, např. `call.completed` + `order.created`).

---

### ContactActivity je append-only projekce

**ContactActivity je append-only projekce historie kontaktu.**

- Není zdrojem business pravdy.
- Není event store.
- **Nikdy** se z ní nesmí číst pro business rozhodování (queue, FAIL threshold, deduplikace, assign, status transitions).
- Zdroj pravdy zůstávají doménové entity: `Contact`, `CallActivity`, `Callback`, `Order`, `Note`.
- ContactActivity slouží **výhradně** pro: timeline, UX, AI kontext, reporting, budoucí export.
- V krizi lze projekci teoreticky rebuildovat backfillem z doménových tabulek (není běžná operace).

**Důležité rozlišení:** timeline UI čte ContactActivity jako **display source of truth** (co zobrazit), ne jako **domain source of truth** (co platí v business logice). Stávající logika typu `countFailOutcomesForContact` zůstává na `CallActivity`.

---

### Business Event Recorder

Veřejné API pro workflow vrstvu:

```typescript
// src/features/contacts/server/record-contact-business-event.ts
await recordContactBusinessEvent({
  tx,                    // povinný Prisma transaction client
  companyId,
  contactId,
  actorUserId?: string,
  correlationId?: string,
  occurredAt: Date,
  activity: {
    kind: ContactActivityKind,
    payload: ContactActivityPayload,
    sourceEntity?: { type: ActivitySourceEntity; id: string },
  },
  audit?: {
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    metadata?: Record<string, unknown>,
  },
});
```

**Odpovědnost recorderu:**

- Není business service, workflow, ani orchestrátor business logiky.
- Pouze atomicky zapisuje výsledek již rozhodnuté business operace do projekcí (`ContactActivity`, volitelně `AuditEvent`).
- Business rozhodnutí vždy vznikají **před** jeho zavoláním.

Recorder deleguje interně na `ContactActivityWriter` a `AuditEventWriter` — implementace je synchronní insert v Slice 9, outbox-ready bez změny workflow signatur.

---

### API kontrakt recorderu

`recordContactBusinessEvent()`:

- **Nevrací** business data.
- **Nevrací** DTO.
- **Nevrací** ID vytvořené activity.
- Návratový typ: `Promise<void>` — pouze uspěje nebo selže v rámci DB transakce.
- Workflow **nesmí** být závislé na návratové hodnotě recorderu.

Auth-only audit (login failure, `user.role_changed`) zůstává u samostatného `recordAuditEvent()` mimo contact recorder.

---

### Payload contract

Každý payload minimálně:

```json
{
  "version": 1,
  "summary": "Hovor dokončen — Objednávka",
  "data": { }
}
```

**Pravidla:**

- `version` — per **kind** (ne globální schema verze celé tabulky).
- `summary` — předrenderovaný text pro timeline a AI (čeština).
- `data` — strukturovaná data pro renderer a AI hydrate.
- Payload je **display-first** a připravený pro AI.
- Payload **není** kopie databázových entit.
- Obsahuje pouze informace potřebné pro zobrazení nebo budoucí AI kontext.
- Zod validace při zápisu: `contactActivityPayloadSchemas[kind][version]`.
- UI renderer podporuje starší verze fallbackem.

---

### Korelace: correlationId

- Pole v DB: `correlationId String?` — **ne** `groupId`.
- Propojuje události vzniklé v rámci jedné business operace (např. call workflow → `CALL_FINISHED` + související audit).
- Odlišné od `sourceEntityType` + `sourceEntityId` (odkaz na konkrétní doménový řádek, idempotence).

---

### Katalog typů aktivit

**MVP enum `ContactActivityKind`:**

| Kind | Trigger | Poznámka |
|------|---------|----------|
| `CONTACT_CREATED` | create contact, CSV import row | `data.source`: `MANUAL` \| `CSV` \| `API` |
| `CONTACT_STATUS_CHANGED` | status change | business-critical, samostatný řádek |
| `CONTACT_ASSIGNED` | assignee change | align s `AuditActions.CONTACT_ASSIGNED` |
| `CONTACT_UPDATED` | phone, email, name, address, priority | jeden řádek per request, `data.changes[]` |
| `NOTE_CREATED` | create note | |
| `CALLBACK_CREATED` | schedule callback | |
| `CALLBACK_COMPLETED` | DONE / CANCELLED | ne při každém reschedule |
| `CALL_FINISHED` | call workflow complete | grouped call+order+callback side effects |
| `ORDER_CREATED` | standalone order (mimo call) | |

**Hybridní model CONTACT_UPDATED:**

- Status a assign jsou business-critical — operátor je chce vidět explicitně bez parsování `changes[]`.
- Profilové změny (telefon, e-mail, priorita) se batchují do jednoho `CONTACT_UPDATED` — timeline zůstává čitelná.
- Align s existujícími audit action kódy v `src/domain/events.ts`.

**CONTACT_CREATED místo CONTACT_IMPORTED:**

- Import není samostatný životní cyklus kontaktu — je to vytvoření kontaktu se `source=CSV`.
- Filtr „Importy“: `kind=CONTACT_CREATED AND data.source=CSV` nebo `filterGroup` v katalogu kinds.
- `importBatchId`, `fileName`, `rowNumber` volitelně v `data` když `source=CSV`.

Katalog kinds: `src/features/contacts/lib/activity-kinds.ts` (vzor `contact-fields.ts`).

---

### ActivitySourceEntity enum

Activity vrstva **nezávisí** na názvech Prisma modelů:

```typescript
enum ActivitySourceEntity {
  CONTACT
  CALL
  NOTE
  ORDER
  CALLBACK
  IMPORT_BATCH
}
```

Mapování v writeru: Prisma record → stabilní enum. Idempotence: `@@unique([companyId, kind, sourceEntityType, sourceEntityId])`.

---

### Datový model

**ContactActivity:**

```prisma
model ContactActivity {
  id               String                @id @default(cuid())
  companyId        String
  contactId        String
  actorUserId      String?
  kind             ContactActivityKind
  occurredAt       DateTime
  sourceEntityType ActivitySourceEntity?
  sourceEntityId   String?
  correlationId    String?
  payload          Json
  createdAt        DateTime              @default(now())

  company Company @relation(...)
  contact Contact @relation(...)
  actor   User?   @relation(...)

  @@index([companyId, contactId, occurredAt(sort: Desc), id(sort: Desc)])
  @@index([companyId, contactId, kind, occurredAt(sort: Desc)])
  @@unique([companyId, kind, sourceEntityType, sourceEntityId])
}
```

**AuditEvent:**

```prisma
model AuditEvent {
  id          String   @id @default(cuid())
  companyId   String
  actorUserId String?
  action      String
  entityType  String
  entityId    String
  contactId   String?
  metadata    Json?
  createdAt   DateTime @default(now())

  company Company @relation(...)
  actor   User?   @relation(...)
  contact Contact? @relation(...)

  @@index([companyId, createdAt(sort: Desc)])
  @@index([companyId, contactId, createdAt(sort: Desc)])
  @@index([companyId, entityType, entityId])
  @@index([companyId, actorUserId, createdAt(sort: Desc)])
}
```

---

### Dlouhodobá vize Activity API

Architektura umožňuje za `recordContactBusinessEvent` připojit další systémy **bez změny workflow vrstvy**:

```
Workflow
  ↓
recordContactBusinessEvent (sync, tx)
  ├── ContactActivity writer
  └── AuditEvent writer (optional)

afterCommit hook (future, prázdný v Slice 9)
  ├── Webhooks
  ├── Notifications
  └── Analytics

onDemand read (Slice 10)
  └── ai-context.service ← čte ContactActivity, hydrate z domain
```

- **AI Context není subscriber** — je reader nad ContactActivity (+ volitelný hydrate z domain přes `sourceEntityId`).
- Webhooks a analytics **nesmí** běžet v DB transakci.
- Outbox tabulka/worker — **ne** v Slice 9; API je outbox-ready (`tx`, idempotence, `occurredAt` z business vrstvy).

Outbox-ready principy (zakotvené v kontraktu, neimplementované ve Slice 9):

1. Workflow volá jen `recordContactBusinessEvent`, nikdy repository přímo.
2. Povinný `tx` v recorder API.
3. `occurredAt` nastavuje business vrstva — worker ho nesmí „vymýšlet“ při replay.
4. Idempotence na `(companyId, kind, sourceEntityType, sourceEntityId)`.
5. Hook `afterCommit` (prázdný v Slice 9) pro budoucí async integrace.

---

### Architektura vrstev

```
UI → Actions → Service → Repository → Prisma
Workflow/Service → recordContactBusinessEvent → Writers → Repository
```

**Integrační body:**

| Workflow | ContactActivity | AuditEvent |
|----------|-----------------|------------|
| `createContact` | `CONTACT_CREATED` | `contact.created` |
| CSV import (per contact) | `CONTACT_CREATED` (source=CSV) | batch + per-contact |
| contact assign/status/update | `CONTACT_ASSIGNED` / `CONTACT_STATUS_CHANGED` / `CONTACT_UPDATED` | odpovídající audit |
| `createNote` | `NOTE_CREATED` | `note.created` |
| `call-workflow` | `CALL_FINISHED` (grouped) | `call.completed`, … |
| `callbacks.service` complete | `CALLBACK_COMPLETED` | `callback.updated` |
| `order-workflow` (standalone) | `ORDER_CREATED` | `order.created` |

**Read path migrace:**

- Timeline primárně z `ContactActivity` (cursor pagination 25–50).
- Volitelný legacy fallback pro kontakty bez backfillu — **neimplementováno** ve Slice 9; kontakty bez záznamů v `ContactActivity` zobrazí prázdnou historii.
- Backfill historie — **ne** v MVP Slice 9.

---

### UX (Slice 9)

- Stránkovaná timeline, filtry (chips: Vše / Hovory / Poznámky / Callbacky / Objednávky / Systém).
- URL filtr `?activity=calls` (konzistentní se Slice 8).
- Empty state v češtině.
- `CALL_FINISHED` s embedded order summary — jeden řádek místo duplicit CALL+ORDER.

---

### SaaS, výkon, GDPR

- Tenant isolation: všechny dotazy `companyId` z session; `assertContactAccess` před read.
- Index pro hlavní dotaz timeline; batch insert activity při CSV importu (chunk 200).
- GDPR: koncept `anonymizeContactActivities(contactId)` — bez implementace exportu ve Slice 9.
- Payload truncace note body (~2000 znaků) v timeline.

---

### Co Slice 9 neřeší

- AI generování (Slice 10).
- Company-wide activity feed.
- Export historie, retention cron, outbox/worker.
- Event sourcing / CQRS.
- JWT refresh strategie — přesunout do pozdějšího hardening slice.

---

### Commit plán (6 commitů)

| # | Commit message | Obsah |
|---|----------------|-------|
| 1 | `docs(contacts): add ADR-009 contact activity and audit model` | ADR-009, adr/README, IMPLEMENTATION_SEQUENCE |
| 2 | `feat(activity): add ContactActivity and AuditEvent schema` | Prisma, migrace, domain enums, payload schemas v1 |
| 3 | `feat(activity): add business event recorder and audit persistence` | recorder, writers, audit.repository |
| 4 | `feat(activity): record events from all contact workflows` | call, order, callback, note, contact, import |
| 5 | `feat(contacts): paginated activity timeline with filters` | read path, UI timeline/filters |
| 6 | `test(contacts): activity E2E tenant isolation and CI` | E2E, tenant tests, CI workflow |

Každý commit: `build` + `lint` green; E2E od commitu 4.

## Důsledky

- Nové business akce musí volat `recordContactBusinessEvent` ve stejné transakci jako doménová změna.
- Workflow a services **nesmí** číst z `ContactActivity` pro business rozhodování.
- Každý nový kind = enum + payload schema v1 + renderer + katalog entry.
- `IMPLEMENTATION_SEQUENCE.md` Slice 9 přejmenován na Contact Activity & Audit.
- Slice 10 (`ai-context.service`) bude číst `ContactActivity` jako primární historii kontaktu.
