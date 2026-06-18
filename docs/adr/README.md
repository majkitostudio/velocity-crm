# Architecture Decision Records (ADR)

Tento adresář obsahuje architektonická rozhodnutí pro Velocity CRM.

## Stav záznamů

| ADR | Téma | Stav |
|-----|------|------|
| [001](./001-lead-workflow-model.md) | Lead workflow vs. Contact status | **Přijato** |
| [002](./002-call-outcome-callback-semantics.md) | `CALL_LATER` vs. `SCHEDULE_CALL` | **Přijato** |
| [003](./003-fail-outcome-behavior.md) | Chování outcome `FAIL` | **Přijato** |
| [004](./004-contact-tags-scope.md) | Tags u kontaktů v MVP | **Otevřené** |
| [005](./005-saas-bootstrap-v1.md) | SaaS bootstrap pro V1 | **Přijato** |

Schválená workflow pravidla: [WORKFLOW_RULES.md](../WORKFLOW_RULES.md)

## Formát ADR

Každý ADR obsahuje:

- **Kontext** — proč rozhodnutí vzniklo
- **Varianty** — možné přístupy s výhodami a nevýhodami
- **Doporučení architekta** — návrh nejlepšího řešení (není finální rozhodnutí)
- **Důsledky** — co rozhodnutí ovlivní v kódu, UI a datech

## Pravidla

- Žádná varianta není považována za schválenou, dokud ADR nemá stav **Přijato**.
- Implementace nesmí předpokládat odpověď z otevřeného ADR.
- Po schválení se ADR aktualizuje stavem **Přijato** a zvolená varianta se zapíše do sekce Rozhodnutí.

## Související dokumenty

- [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)
- [IMPLEMENTATION_SEQUENCE.md](../IMPLEMENTATION_SEQUENCE.md)
