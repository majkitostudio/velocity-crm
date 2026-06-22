# ADR-011: Unified Contact Context Platform

**Stav:** Přijato  
**Datum:** 2026-06-21  
**Schváleno:** 2026-06-21  
**Související:** [ADR-010](./010-ai-context-architecture.md), [IMPLEMENTATION_SEQUENCE.md](../IMPLEMENTATION_SEQUENCE.md), [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)

## Kontext

Slice 10 zavedl `ContactAiContextBuilder` a Context Providers pro AI. Contact Detail stránka (`getContactDetailView`) načítala data paralelně vlastní cestou přes repositories. Vznikly dvě implementace stejné orchestrace.

Slice 10.5 sjednocuje read path do **Contact Data Platform** bez změny Slice 10 AI kontraktu.

## Rozhodnutí

### ContactContext jako Single Source of Truth

`ContactContext` je immutable read-only platformní kontrakt v `src/features/contacts/context/`.

- Neutrální typy (`Date`, Prisma enumy)
- Sestaven `buildContactContextForTenant()` z Context Providerů
- Sub-section granularita: `snapshot.workflow`, `snapshot.callbacks`, …

### AI kontrakt zůstává — jako projekce

`ContactAiContext` (Slice 10) se **nemění sémanticky**. Vzniká mapováním:

```
buildContactContextForTenant() → ContactContext → toContactAiContext() → ContactAiContext
```

`buildContactAiContextForTenant()` je tenký wrapper (1–2 iterace) pro zpětnou kompatibilitu.

### Závislostní pravidla

```
contacts/context → repositories     ✅
ai               → contacts/context  ✅
contacts/context → ai               ❌
contacts/UI      → contacts/context  ✅
contacts/UI      → ai                ❌
```

Contact Detail **nesmí** importovat `features/ai`.

### Contact Detail ViewModel

UI konzumuje `ContactDetailView` mapovaný z `ContactContext` (`mapContactDetailView`). UI-only pole (`workflowBadge`, `sourceCallback`) zůstávají v mapperu.

Preset pro detail page:

```typescript
CONTACT_DETAIL_CONTEXT_OPTIONS = {
  sections: contact, snapshot.workflow, snapshot.callbacks, snapshot.notes,
  includeHistory: false,
  includeStatistics: false,
  limits: { notes: null }, // unlimited — stejné chování jako před 10.5
}
```

### Co zůstává mimo platformu

| Concern | Důvod |
|---------|-------|
| Activity timeline pagination | Interaktivní cursor + filtry |
| Callbacks panel RBAC metadata | Formulářová concern (`assignableOperators`) |
| LLM serializace | Slice 11 — LLM Adapter |

### Request-scoped cache

`getContactContextForTenant()` je obalen `React cache()` — Contact Detail a Callbacks panel sdílí jeden load per request (`CONTACT_DETAIL_CONTEXT_OPTIONS`).

## Důsledky

- Providery žijí v `src/features/contacts/context/providers/`
- Slice 11 (LLM Adapter) staví na stabilním `ContactAiContext` odvozeném z platformy
- Nové domény = nový provider + sub-section (viz ADR-010 Future Context Sources)

## Co Slice 10.5 neřeší

- LLM integrace (Slice 11)
- Cross-request cache
- Refactor activity timeline na platformu
