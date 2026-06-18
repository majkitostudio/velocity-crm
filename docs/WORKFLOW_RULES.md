# Workflow Rules — Schválená business pravidla

**Status:** Schváleno  
**Datum schválení:** 2026-06-18  
**Související ADR:** [001](./adr/001-lead-workflow-model.md), [002](./adr/002-call-outcome-callback-semantics.md), [003](./adr/003-fail-outcome-behavior.md)

Tento dokument je závazný pro implementaci Operator Workflow a Call Workflow.

---

## Operator Workflow

### Fronta práce (`operator-queue`)

Operátor pracuje z fronty seřazené takto:

1. **Callbacky** — `Callback.status = OPEN`, `scheduledAt <= now`, přiřazené operátorovi
2. **Leady** — `Contact.status = LEAD`, přiřazené operátorovi (`assignedUserId`)

V rámci každé skupiny řazení:

1. `Contact.priority`: `HIGH` → `NORMAL` → `LOW`
2. `createdAt` vzestupně (nejstarší první)

Callbacky mají přednost před leady (callbacky vždy nahoře).

### Workflow stavy (odvozené — bez DB pole)

| UI stav | Pravidlo |
|---------|----------|
| **New** | `status = LEAD` AND `assignedUserId IS NULL` |
| **Assigned** | `status = LEAD` AND `assignedUserId IS NOT NULL` |
| **In Progress** | UI stav — operátor má otevřený detail kontaktu (není v DB) |
| **Converted** | `status IN (CUSTOMER, VIP)` |
| **Failed** | `status = LOST` |

### Přiřazení leadů

- Pouze `ADMIN` a `MANAGER` mohou přiřazovat nepřiřazené leady operátorům.
- Operátor smí volat pouze kontakty přiřazené jemu (kromě admin/manager).

### Oprávnění k frontě

- **Operátor:** vidí pouze svou frontu.
- **Manager / Admin:** mohou zobrazit frontu jiného operátora a seznam nepřiřazených leadů.

---

## Call Workflow

Po každém hovoru operátor **musí** zvolit právě jeden outcome. Bez outcome nelze workflow dokončit.

Všechny side effects probíhají v **jedné transakci** v `CallWorkflow` orchestrátoru.

### `ORDER`

- Vytvoří nebo propojí objednávku (`Order` + `OrderItem[]`) — objednávka musí mít alespoň jednu položku.
- `Contact.status` → `CUSTOMER`.
- Pokud existuje otevřený callback pro tento kontakt operátora → `Callback.status` → `DONE`.
- Vytvoří `CallActivity` s `outcome = ORDER` a `orderId`.
- Audit: `call.completed`, `order.created` (pokud nová objednávka).

### `CALL_LATER`

- Automaticky vytvoří `Callback` se `status = OPEN`.
- `scheduledAt = now + 4 hodiny` (MVP konstanta `CALL_LATER_DELAY_HOURS`).
- Operátor **nevolí** datum — rychlé „zavolám později".
- `Contact.status` beze změny.
- Vytvoří `CallActivity` s `outcome = CALL_LATER`.
- Audit: `call.completed`, `callback.created`.

### `SCHEDULE_CALL`

- Vytvoří `Callback` se `status = OPEN`.
- `scheduledAt` je **povinný** z formuláře (musí být v budoucnu).
- `Contact.status` beze změny.
- Vytvoří `CallActivity` s `outcome = SCHEDULE_CALL`.
- Audit: `call.completed`, `callback.created`.

### `FAIL`

- Vytvoří `CallActivity` s `outcome = FAIL`.
- Spočítá po sobě jdoucí / celkové FAIL pro kontakt z `CallActivity` (MVP: celkový počet `FAIL` outcomes).
- Pokud počet `FAIL` ≥ **3** (`FAIL_THRESHOLD`) → `Contact.status` → `LOST`.
- Jinak `Contact.status` zůstává `LEAD` — lead zůstává ve frontě pro další pokus.
- Po přechodu na `LOST`: audit `contact.status_changed`.
- Audit: `call.completed`.

### Validace před dokončením hovoru

- Kontakt musí existovat v `companyId` aktuálního uživatele.
- Operátor musí mít oprávnění k kontaktu (assigned nebo admin/manager).
- `ORDER` bez objednávky (položek) je **neplatný**.
- `SCHEDULE_CALL` bez `scheduledAt` je **neplatný**.
- `callbackId` (pokud předán) musí patřit kontaktu a company.

---

## Konstanty (MVP)

Definovány v `src/domain/workflow.ts`:

| Konstanta | Hodnota | Popis |
|-----------|---------|-------|
| `CALL_LATER_DELAY_HOURS` | `4` | Default odklad pro CALL_LATER |
| `FAIL_THRESHOLD` | `3` | Počet FAIL před přechodem na LOST |

Budoucí rozšíření: konfigurace per `Company` v settings (Phase 11).

---

## Mapování na implementaci

| Pravidlo | Modul |
|----------|-------|
| Operator fronta | `src/features/operator-queue/server/` |
| Call orchestrátor | `src/features/calls/server/call-workflow.ts` (Slice 4) |
| Konstanty | `src/domain/workflow.ts` |
| Audit kódy | `src/domain/events.ts` |
