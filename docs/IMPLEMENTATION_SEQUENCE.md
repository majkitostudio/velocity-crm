# Implementation Sequence

**Status:** Plán zavedení [TARGET_ARCHITECTURE.md](./TARGET_ARCHITECTURE.md)  
**Verze:** 1.0  
**Předpoklad:** Otevřená ADR v `docs/adr/` schválena před implementací dotčených částí.

Tento dokument definuje **bezpečné vertikální kroky** zavedení architektonického standardu. Každý krok doručuje funkční řez aplikace a neblokuje další vývoj.

---

## Principy pořadí

1. **Vertikální řezy** — každý krok končí ověřitelným chováním v prohlížeči nebo testu.
2. **Workflow před kosmetikou** — call orchestrátor před pokročilým reportingem.
3. **Tenant isolation od začátku** — každý nový modul musí projít checklistem z TARGET_ARCHITECTURE.
4. **ADR gate** — kroky závislé na otevřeném rozhodnutí jsou označeny a čekají na schválení ADR.
5. **Postupná repository vrstva** — nový kód přes repository; legacy `server/*.ts` refaktorovat při dotyku.

---

## Přehled fází

```mermaid
flowchart TD
  S0[Slice 0: Foundation] --> S1[Slice 1: Auth Shell]
  S1 --> S2[Slice 2: Operator Dashboard]
  S2 --> S3[Slice 3: Contact Detail]
  S3 --> S4[Slice 4: Call Workflow]
  S4 --> S5[Slice 5: Products]
  S5 --> S6[Slice 6: Orders Integration]
  S6 --> S7[Slice 7: Callbacks UI]
  S7 --> S8[Slice 8: Contacts List and Import]
  S8 --> S9[Slice 9: Contact Activity and Audit]
  S9 --> S10[Slice 10: AI V1]
```

---

## Slice 0: Foundation

**Cíl:** Reprodukovatelné prostředí a sdílené domain building blocks.

### Úkoly

| # | Úkol | Výstup |
|---|------|--------|
| 0.1 | `npm install`, `prisma generate`, `prisma migrate dev` | Funkční DB |
| 0.2 | Seed script: `Company` + `ADMIN` (dle ADR-005) | Přihlásitelný admin |
| 0.3 | `src/domain/errors.ts` — typované doménové chyby | `ForbiddenError`, `NotFoundError`, `ValidationError` |
| 0.4 | `src/domain/events.ts` — audit action konstanty | Sdílené action kódy |
| 0.5 | Zod dependency + pattern pro `schemas.ts` | Validační standard |
| 0.6 | Aktualizace README — setup, env, architektura | Onboarding |

### Definition of Done

- [x] `npm run build` prochází
- [x] Seed script připraven (`npm run prisma:seed` po spuštění PostgreSQL)
- [x] Dokumentace setupu v README
- [x] Počáteční migrace v `prisma/migrations/`

### Závislosti

- **ADR-005** — forma seedu (jedna company vs. více)

---

## Slice 1: Auth Shell

**Cíl:** Přihlášení, odhlášení, chráněný CRM layout.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 1.1 | Login page | `app/(auth)/login/page.tsx` |
| 1.2 | Login Server Action | `src/features/auth/actions.ts`, `schemas.ts` |
| 1.3 | Middleware — ochrana `(crm)/*` | `middleware.ts` |
| 1.4 | CRM layout s `requireCurrentUser` | `app/(crm)/layout.tsx` |
| 1.5 | Redirect `/` → dashboard nebo login | `app/page.tsx` |
| 1.6 | Logout action | `src/features/auth/actions.ts` |

### Vrstvy

```
LoginPage → loginAction → Auth.js signIn
(crm)/layout → requireCurrentUser → children
```

### Definition of Done

- [x] Nepřihlášený uživatel na `/dashboard` → redirect `/login`
- [x] Platné credentials → dashboard
- [x] Logout funguje

---

## Slice 2: Operator Dashboard

**Cíl:** První funkční CRM obrazovka — fronta práce operátora.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 2.1 | Refaktor `queue.ts` → service + repository | `operator-queue/server/` |
| 2.2 | Action pro načtení fronty | `operator-queue/actions.ts` |
| 2.3 | Dashboard page | `app/(crm)/dashboard/page.tsx` |
| 2.4 | Zobrazení callbacků a leadů dle priority | UI komponenty |
| 2.5 | Manager: nepřiřazené leady + assign | actions + UI (role guard) |

### Vrstvy

```
dashboard/page.tsx → getOperatorQueueAction → queue.service → queue.repository → Prisma
```

### Definition of Done

- [x] Operátor vidí svou frontu
- [ ] Manager vidí nepřiřazené leady a může assignovat (odloženo — mimo scope Slice 2 request)
- [x] Tenant isolation test: operátor nevidí data jiné company — `tests/e2e/contacts/activity-tenant-isolation.spec.ts`

---

## Slice 3: Contact Detail

**Cíl:** Detail kontaktu s poznámkami a historií.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 3.1 | Rozšířit contacts service: list, activity feed | `contacts/server/contacts.service.ts` |
| 3.2 | Contacts repository | `contacts/server/contacts.repository.ts` |
| 3.3 | Contact detail page | `app/(crm)/contacts/[contactId]/page.tsx` |
| 3.4 | Create note action | `notes/actions.ts` |
| 3.5 | Activity timeline (calls, notes, orders, callbacks) | read service / view model |

### Definition of Done

- [x] Detail kontaktu zobrazí základní data a poznámky
- [x] Operátor může přidat poznámku
- [x] Cross-tenant přístup k cizímu `contactId` vrátí 404 / NotFound

---

## Slice 4: Call Workflow

**Cíl:** Povinný outcome hovoru s transakčním orchestrátorem.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 4.1 | `CallWorkflow` orchestrátor | `calls/server/call-workflow.ts` |
| 4.2 | Outcome side effects dle ADR-002, ADR-003 | v orchestrátoru |
| 4.3 | `completeCallAction` + schema | `calls/actions.ts`, `schemas.ts` |
| 4.4 | UI formulář outcome na contact detail | client component |
| 4.5 | Integrace s dashboard queue (next contact) | navigace po complete |
| 4.6 | Audit `call.completed` | `src/server/audit.ts` (základ) |

### ADR gate

- **ADR-002** — `CALL_LATER` vs `SCHEDULE_CALL`
- **ADR-003** — chování `FAIL`
- **ADR-001** — vliv na workflow stavy v UI

### Vrstvy

```
ContactPage → completeCallAction → CallWorkflow → services/repos → transaction + audit
```

### Definition of Done

- [x] Bez outcome nelze dokončit hovor
- [x] `ORDER` tlačítko viditelné, dokončení odloženo do Slice 6
- [x] Callback outcomes vytvoří callback dle schváleného ADR
- [x] Navigace „Back to queue" po dokončení hovoru
- [ ] Integrační test: všechny outcomes v transakci (Slice 9)

---

## Slice 5: Products

**Cíl:** Aktivní produktový katalog pro objednávky.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 5.1 | Products service + repository | `products/server/` |
| 5.2 | CRUD actions (admin/manager) | `products/actions.ts` |
| 5.3 | Kategorie + produkty UI | `app/(crm)/products/` |
| 5.4 | Seed nebo admin UI pro první produkty | seed rozšíření |

### Definition of Done

- [ ] Admin může spravovat katalog
- [ ] Operátor vidí aktivní produkty při tvorbě objednávky
- [ ] Neaktivní produkt nelze objednat

---

## Slice 6: Orders Integration

**Cíl:** Objednávky propojené s call workflow.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 6.1 | `OrderWorkflow` orchestrátor | `orders/server/order-workflow.ts` |
| 6.2 | Refaktor `orders.ts` → service + repository | `orders/server/` |
| 6.3 | `createOrderAction` + UI na contact detail | `orders/actions.ts` |
| 6.4 | Propojení `ORDER` outcome s OrderWorkflow | `call-workflow.ts` |
| 6.5 | Audit `order.created` | audit service |
| 6.6 | Order history na contact detail | read path |

### Definition of Done

- [ ] Objednávka vznikne z call flow nebo samostatného formuláře
- [ ] `ORDER` outcome bez objednávky není možný (po schválení pravidla)
- [ ] Order items validují produkty v rámci company

---

## Slice 7: Callbacks UI

**Cíl:** Plánování a správa callbacků mimo automatické outcome side effects.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 7.1 | Refaktor callbacks → service + repository | `callbacks/server/` |
| 7.2 | create/update callback actions | `callbacks/actions.ts` |
| 7.3 | Callback list / kalendář view | `app/(crm)/callbacks/` |
| 7.4 | Callback status transitions (state machine) | callbacks.service |
| 7.5 | Audit callback events | audit service |

### Definition of Done

- [ ] Operátor může ručně naplánovat callback
- [ ] Due callbacky se objeví ve frontě
- [ ] Dokončený callback zmizí z fronty

---

## Slice 8: Contacts List and Import

**Cíl:** Seznam kontaktů, vyhledávání a CSV import.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 8.1 | Contacts list + search + filter | `app/(crm)/contacts/page.tsx` |
| 8.2 | Create contact action + form | `contacts/actions.ts` |
| 8.3 | CSV import workflow | `contacts/server/import-workflow.ts` |
| 8.4 | Duplicate detection (phone/email per company) | již částečně v contacts |
| 8.5 | Bulk assign operátorům | manager action |
| 8.6 | Tags — pouze pokud ADR-004 schválí | schema + UI |

### ADR gate

- **ADR-004** — tags v tomto slice nebo později

### Definition of Done

- [ ] Manager importuje CSV s validací a deduplikací
- [ ] Contacts list filtruje podle status, source, priority
- [x] Import neporuší tenant isolation — E2E + tenant seed `seed-company-other`

---

## Slice 9: Contact Activity & Audit

**Cíl:** Jednotná append-only historie kontaktu + persistovaný audit; stránkovaná timeline; tenant testy a CI.

**ADR gate:** [ADR-009](./adr/009-contact-activity-and-audit.md)

### Úkoly

| # | Úkol | Soubory (cíl) | Commit |
|---|------|----------------|--------|
| 9.0 | ADR-009, update adr/README | `docs/adr/` | 1 |
| 9.1 | Prisma `ContactActivity`, `AuditEvent`, enums, migrace | `prisma/schema.prisma`, `src/domain/` | 2 |
| 9.2 | `recordContactBusinessEvent`, writers, audit persistence | `src/features/contacts/server/`, `src/server/audit.ts` | 3 |
| 9.3 | Wire all workflows (call, order, callback, note, contact, import) | workflow + service soubory | 4 |
| 9.4 | Paginated timeline read path + UI filters | `contact-activity.*`, timeline komponenty | 5 |
| 9.5 | E2E, tenant isolation tests, CI workflow | `tests/`, `.github/workflows/` | 6 |

### Commit plán

| # | Commit message |
|---|----------------|
| 1 | `docs(contacts): add ADR-009 contact activity and audit model` |
| 2 | `feat(activity): add ContactActivity and AuditEvent schema` |
| 3 | `feat(activity): add business event recorder and audit persistence` |
| 4 | `feat(activity): record events from all contact workflows` |
| 5 | `feat(contacts): paginated activity timeline with filters` |
| 6 | `test(contacts): activity E2E tenant isolation and CI` |

Každý commit: `build` + `lint` green; E2E od commitu 4.

### Definition of Done

- [x] Timeline čte z `ContactActivity` se stránkováním
- [x] Všechny kritické workflow zapisují activity + audit v transakci
- [x] ContactActivity se nečte pro business rozhodování (ADR-009)
- [x] Cross-tenant testy procházejí
- [x] CI běží na každý push
- [x] ADR-009 schváleno a implementace v souladu

---

## Slice 10: AI V1

**Cíl:** AI asistent nad reálnými daty kontaktu.

### Úkoly

| # | Úkol | Soubory (cíl) |
|---|------|----------------|
| 10.1 | `ai-context.service.ts` — sestavení kontextu | `ai/server/` |
| 10.2 | OpenAI integrace (nebo schválený provider) | `ai/server/` |
| 10.3 | Task types: summary, history, next action | actions |
| 10.4 | UI panel na contact detail | client component |
| 10.5 | `createAiLog` + audit `ai.generated` | existující + audit |

### Předpoklad

- Slice 3–8 musí dodat dostatek reálných dat (calls, notes, orders, callbacks).

### Definition of Done

- [ ] Operátor vidí AI shrnutí na detailu kontaktu
- [ ] Výstupy uloženy v `AiLog`
- [ ] PII v promptech ošetřena dle audit standardu

---

## Refactoring backlog (průběžně)

Tyto úkoly se provádějí při dotyku souvisejícího kódu, ne jako blok:

| Úkol | Priorita |
|------|----------|
| Přejmenovat `src/features/*/server/*.ts` na `*.service.ts` | Střední |
| Extrahovat Prisma dotazy do `*.repository.ts` | Střední |
| Odstranit nebo zdokumentovat unused Auth.js DB modely (`Session`, `Account`) | Nízká |
| `User.email` → `@@unique([companyId, email])` pro SaaS | Před Phase 11 |
| Supabase RLS policies | Před multi-tenant produkcí |
| JWT refresh strategie pro role changes | Production Hardening slice |
| `src/server/tenant.ts` assert helpery | Production Hardening slice |

---

## Checklist pro každý nový slice

Před merge každého slice ověřit:

- [ ] Vrstvy dodrženy (UI → Actions → Workflow/Service → Repository → Prisma)
- [ ] Všechny dotazy tenant-scoped
- [ ] Zod schema pro každou mutaci
- [ ] Role guards aplikovány
- [ ] Audit eventy pro kritické akce
- [ ] ContactActivity zapisována přes `recordContactBusinessEvent` (od Slice 9)
- [ ] ContactActivity se nečte pro business rozhodování (ADR-009)
- [ ] `revalidatePath` / cache invalidation
- [ ] Otevřená ADR neporušena
- [ ] Alespoň jeden test tenant isolation (od Slice 2)

---

## Mapování na ROADMAP.md

| Roadmap fáze | Implementation slice |
|--------------|---------------------|
| Phase 0 | Slice 0 |
| Phase 1 | Slice 1 |
| Phase 2 | Slice 2 |
| Phase 3 | Slice 3, 8 |
| Phase 4 | Slice 8 |
| Phase 5 | Slice 4 |
| Phase 6 | Slice 7 |
| Phase 7 | Slice 5 |
| Phase 8 | Slice 6 |
| Phase 9 | Slice 10 |
| Phase 10 | Po Slice 10 (reporting — nový slice) |
| Phase 11 | Po MVP (SaaS foundation) |

---

## Související dokumenty

- [TARGET_ARCHITECTURE.md](./TARGET_ARCHITECTURE.md)
- [adr/README.md](./adr/README.md)
- [ROADMAP.md](./ROADMAP.md)
