# ADR-004: Contact Tags Scope

**Stav:** Otevřené  
**Datum:** 2026-06-18  
**Související:** [ROADMAP.md](../ROADMAP.md) Phase 3, [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)

## Kontext

Roadmap Phase 3 uvádí **tags** u kontaktů. MVP v PROJECT_VISION tags nezmiňuje. Prisma schema tags nemá.

Tags by umožnily segmentaci (kampaně, produktové linie, prioritu importu), ale přidávají schema, UI a import logiku.

## Varianty

### Varianta A: Tags v MVP (Phase 3)

Přidat model:

```text
Tag { id, companyId, name }
ContactTag { contactId, tagId }  // M:N
```

**Výhody:**

- Silná filtrace a segmentace od začátku
- Užitečné pro CSV import s tagy z kampaně
- Manager může filtrovat leady podle zdroje/kampaně

**Nevýhody:**

- Rozšíření schema a UI před core workflow
- Import validace složitější
- Odložení dokončení call workflow a dashboardu

### Varianta B: Odložit tags na post-MVP

MVP používá existující pole: `ContactSource`, `ContactPriority`, `assignedUserId`.

**Výhody:**

- Rychlejší doručení operator loop
- `ContactSource` (CSV, MANUAL, API) pokrývá část use case
- Menší scope Phase 3

**Nevýhody:**

- Roadmap Phase 3 explicitně zmiňuje tags — nesoulad s plánem
- Kampaně bez více tagů na kontakt
- Budoucí migrace dat z workaroundů

### Varianta C: Jednoduché textové pole `tags` na Contact

Pole `tags: String[]` nebo JSON na `Contact` bez normalizované Tag entity.

**Výhody:**

- Rychlá implementace
- Stačí pro CSV import a základní filtr
- Bez M:N tabulky

**Nevýhody:**

- Duplicitní názvy tagů, bez company-wide slovníku
- Horší reporting a autocomplete
- Technický dluh při přechodu na normalizovaný model

## Doporučení architekta

Doporučuji **Variantu B** pro MVP:

- Filtrovat podle `ContactSource`, `ContactPriority`, `status`, `assignedUserId`
- Tags zařadit do samostatné fáze po dokončení call workflow a importu
- Pokud import z CSV vyžaduje tagy hned, použít dočasně **Variantu C** s plánem migrace na **Variantu A**

## Důsledky

| Varianta | Schema | Phase 3 scope | Import |
|----------|--------|---------------|--------|
| A | Tag + ContactTag | Plný | Tag sloupce v CSV |
| B | Beze změny | Tags vynechány | Source/priority |
| C | Pole na Contact | Částečný | Volný text |

## Rozhodnutí

_Pending — čeká na společné schválení._
