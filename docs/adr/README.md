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
| [006](./006-contacts-list-and-navigation.md) | Seznam kontaktů, filtry URL, breadcrumb | **Přijato** |
| [007](./007-contact-phone-normalization.md) | Normalizace telefonu a e-mailu | **Přijato** |
| [008](./008-csv-contact-import-pipeline.md) | CSV import pipeline a katalog polí | **Přijato** |
| [009](./009-contact-activity-and-audit.md) | Contact Activity projekce a AuditEvent | **Přijato** |
| [010](./010-ai-context-architecture.md) | AI Context Builder a Context Providers | **Přijato** |
| [011](./011-unified-contact-context-platform.md) | Unified Contact Context Platform (Slice 10.5) | **Přijato** |
| [012](./012-llm-adapter-architecture.md) | LLM Adapter Architecture (Slice 11) | **Přijato** |

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
