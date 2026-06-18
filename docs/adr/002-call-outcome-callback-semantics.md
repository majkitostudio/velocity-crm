# ADR-002: Call Outcome Callback Semantics

**Stav:** Přijato  
**Datum:** 2026-06-18  
**Schváleno:** 2026-06-18  
**Související:** [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md), ADR-001

## Kontext

Po hovoru operátor volí jeden z výsledků: `ORDER`, `CALL_LATER`, `SCHEDULE_CALL`, `FAIL`.

Dva outcomes (`CALL_LATER` a `SCHEDULE_CALL`) implikují budoucí kontakt, ale dokumentace nedefinuje jejich rozdíl. Současný kód (`completeCall`) při těchto outcomes **nevytváří callback automaticky**.

Bez rozhodnutí nelze implementovat `CallWorkflow` orchestrátor konzistentně.

## Varianty

### Varianta A: Dva typy callbacku s odlišným UX

| Outcome | Chování | UI |
|---------|---------|-----|
| `CALL_LATER` | Automatický callback s default odkladem (např. +2 h / konec směny) | Operátor nevolí datum — rychlé „zavolám později" |
| `SCHEDULE_CALL` | Callback s povinným `scheduledAt` z formuláře | Operátor vybere přesný datum a čas |

**Výhody:**

- Intuitivní pro operátory — rychlá vs. plánovaná akce
- Jasné rozlišení v reportingu
- Odpovídá názvům outcomes v dokumentaci

**Nevýhody:**

- Nutnost definovat a konfigurovat default odklad pro `CALL_LATER`
- Dva UI flow pro podobný výsledek
- Riziko zneužití `CALL_LATER` místo přesného plánování

### Varianta B: Oba outcomes → Callback, rozdíl jen v metadatech

Oba outcomes vytvoří `Callback` se `status = OPEN`. Rozdíl je v poli `note` nebo budoucím `callbackType`:

```text
CALL_LATER → callbackType: FLEXIBLE (scheduledAt = now + default)
SCHEDULE_CALL → callbackType: FIXED (scheduledAt = user input)
```

**Výhody:**

- Jednotný datový model
- Jednoduchá queue logika (oba jsou callbacky)
- Snadné rozšíření o další typy

**Nevýhody:**

- Vyžaduje rozšíření schema (`callbackType` nebo konvence v `note`)
- Produktový rozdíl méně viditelný bez UI práce

### Varianta C: Sloučit do jednoho outcome

Ponechat pouze `SCHEDULE_CALL`. `CALL_LATER` se odstraní nebo mapuje na `SCHEDULE_CALL` s předvyplněným časem.

**Výhody:**

- Nejjednodušší implementace
- Jeden UI flow
- Méně rozhodování pro operátora

**Nevýhody:**

- Rozchod s dokumentací a existujícím enum v schema
- Pomalejší UX pro běžný „zavolám za chvíli" scénář
- Migrace enumu a dokumentace

## Doporučení architekta

Doporučuji **Variantu A**:

- `CALL_LATER`: `CallWorkflow` vytvoří callback s `scheduledAt = now + companyDefaultDelay` (konfigurovatelné později v Company settings)
- `SCHEDULE_CALL`: `CallWorkflow` vyžaduje `scheduledAt` z validovaného inputu
- Queue řadí oba typy stejně podle `scheduledAt`

Pro MVP stačí hardcoded default delay (např. 4 hodiny) bez Company settings UI.

## Důsledky

| Varianta | Schema | CallWorkflow | Formulář |
|----------|--------|--------------|----------|
| A | Beze změny | Různá logika scheduledAt | Dva UI módy |
| B | Možné rozšíření | Jednotná logika + metadata | Střední složitost |
| C | Změna enum | Jednoduchá | Jeden mód |

## Rozhodnutí

**Přijata varianta A** — dva odlišné UX módy pro callback outcomes.

| Outcome | Pravidlo |
|---------|----------|
| `CALL_LATER` | Automatický callback, `scheduledAt = now + 4h` (`CALL_LATER_DELAY_HOURS`) |
| `SCHEDULE_CALL` | Callback s povinným `scheduledAt` z formuláře |

Oba typy se řadí ve frontě stejně podle `scheduledAt`.

Detailní pravidla: [WORKFLOW_RULES.md](../WORKFLOW_RULES.md#call-workflow).
