# ADR-010: AI Context Architecture

**Stav:** Přijato  
**Datum:** 2026-06-21  
**Schváleno:** 2026-06-21  
**Související:** [ADR-009](./009-contact-activity-and-audit.md), [IMPLEMENTATION_SEQUENCE.md](../IMPLEMENTATION_SEQUENCE.md), [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)

## Kontext

Slice 9 zavedl `ContactActivity` jako append-only projekci historie kontaktu připravenou pro AI čtení. Slice 10 je první krok AI platformy Velocity CRM — **příprava strukturovaného kontextu** bez komunikace s LLM.

Budoucí AI funkce (Summary, Recommendations, Sales Copilot, Workflow Assistant) potřebují jednotný, deterministický a provider-agnostic datový model. Bez oddělené context vrstvy by každá AI feature duplikovala dotazy do repository a míchala business logiku s prompt engineeringem.

## Rozhodnutí

### Immutable read-only kontrakt

`ContactAiContext` představuje **immutable read-only kontrakt**. Builder konstruuje finální objekt jednorázově a vrací ho po `deepFreeze` (`Object.freeze` rekurzivně + `Readonly` typy).

Jakmile je kontext vytvořen, žádná další vrstva — AI služby, LLM adaptéry, workflow ani UI — jej nesmí modifikovat; pouze čtou. Platí to pro `contact`, `snapshot`, `history`, `statistics` i volitelná `metadata` včetně všech vnořených objektů a polí.

### AI Context Builder jako čistá datová vrstva

Centrální orchestrátor `buildContactAiContext()` sestavuje `ContactAiContext` z Context Providerů. Builder:

- **neobsahuje** AI logiku, prompty, interpretaci dat ani workflow rozhodování,
- **neimportuje** žádný LLM SDK,
- **je deterministický** — pro stejná vstupní data a options vrací stejný výstup (bez metadata v defaultním režimu),
- načítá providery **paralelně** (`Promise.all`).

### Context Providers a registry

Každý provider má jedinou doménovou odpovědnost, čte pouze repository své domény a nezná ostatní providery.

Providery jsou registrovány v **Provider Registry** — orchestrace (paralelní načtení, assign výstupů) iteruje registry, ne hardcoded seznam provider instancí. Nový provider vyžaduje registry entry, rozšíření typů a mapování do `ContactAiContext` (viz Future Context Sources).

| Provider | Zdroj | Část kontextu |
|----------|-------|---------------|
| Activity | `ContactActivity` | `history` |
| Contact | `Contact`, `CallActivity` | `contact`, `snapshot.workflow` |
| Orders | `Order`, `OrderItem` | `snapshot.orders` |
| Callbacks | `Callback` | `snapshot.callbacks` |
| Products | `Product`, order items | `snapshot.products` |
| Notes | `Note` | `snapshot.notes` |

AI vrstva **nikdy nepristupuje přímo do Repository** — pouze přes Context Providery.

### History vs Snapshot

| Část | Zdroj | Význam |
|------|-------|--------|
| `history.activities` | **výhradně** `ContactActivity` | chronologický průběh práce s kontaktem |
| `snapshot.*` | business entity tabulky | aktuální stav v okamžiku sestavení |

Historie se **nikdy** neskládá z `CallActivity`, `Order`, `Callback` ani jiných business tabulek.

Záměrné překryvy: poznámky existují v historii (`NOTE_CREATED` payload) i ve snapshotu (plné texty z `Note`); hovory v historii (`CALL_FINISHED`) vs `snapshot.workflow.lastCall` z business tabulky.

### Statistics Factory (ne samostatný DB provider)

`statistics` nečtou databázi znovu. Vznikají jako **agregace metadat**, která jednotlivé providery vrátí spolu se svými daty (např. `totalOrderCount` z Orders provideru, `callFinishedCount` z Activity provideru).

Tím se minimalizuje počet SQL dotazů a statistics zůstávají konzistentní s načteným kontextem. Počty, které nelze odvodit z načtených řádků, poskytuje příslušný provider jako `aggregates` ve stejném doménovém dotazu.

### Oddělení od LLM Adapteru

```
Repositories → Context Providers → ContactAiContextBuilder → ContactAiContext
                                                                    ↓
                                                          LLM Adapter (budoucí slice)
```

`ContactAiContext` je univerzální JSON struktura použitelná pro OpenAI, Anthropic, Gemini, Ollama, vLLM, interní služby, veřejné API i mobilní klienty. Transformace do provider-specific formátu je výhradně odpovědností LLM Adapteru.

### Typová bezpečnost activity payloadů

Activity záznamy používají **discriminated union** podle `ContactActivityKind` s typovanými `data` poli odvozenými ze Zod schémat v `activity-payloads.ts`.

### BuildContactAiContextOptions

Rozhraní je připraveno pro budoucí scénáře:

- `sections` — selektivní načtení (`contact`, `snapshot`, `history`, `statistics`)
- `limits` — limity per doména
- `includeHistory`, `includeStatistics`, `includeSensitiveData`, `includeMetadata`

Výchozí režim je deterministický (`includeMetadata: false`). Metadata (`generatedAt`, `generatedFromActivityId`) lze zapnout pro runtime/cache scénáře.

### Verzování

- `schemaVersion` na celém `ContactAiContext`
- `providerVersions` v metadata (budoucí) — per-provider verze pro evoluci sekcí bez breaking změny celého schématu

### Umístění v projektu

```
src/features/ai/
  context/
    types/
    providers/
    statistics/
    contact-ai-context.builder.ts
  server/
    contact-ai-context.service.ts
```

### Připravenost na budoucí AI funkce

| Funkce | Využití kontextu |
|--------|------------------|
| AI Summary | `contact` + `history` + `snapshot` |
| AI Recommendations | `statistics` + `snapshot.products` |
| AI Sales Copilot | `products.catalog` + `snapshot.orders` |
| AI Workflow Assistant | `snapshot.workflow` + `history` |
| Slice 10.5 unified loader | `sections` pro partial load |

### Future Context Sources

Slice 10 implementuje providery pro stávající CRM domény. Architektura je připravena na rozšíření o další zdroje kontextu bez změny LLM vrstvy — každý nový zdroj přidá vlastní provider:

| Plánovaný provider | Doména | Typická sekce kontextu |
|--------------------|--------|------------------------|
| Email | doručená/odeslaná komunikace | `snapshot.communications` (budoucí) |
| SMS | textové zprávy | `snapshot.communications` (budoucí) |
| WhatsApp | messaging integrace | `snapshot.communications` (budoucí) |
| Call recording / transcript | nahrávky a přepisy hovorů | `history` nebo `snapshot` (budoucí) |
| External CRM sync | importovaná historie | `history` (budoucí) |

Postup přidání nového provideru:

1. Implementovat `ContactContextProvider` pro doménu.
2. Přidat do `contactContextProviderRegistry`.
3. Rozšířit typy (`ContactContextProviderKey`, `ContactAiContext` sekce).
4. Aktualizovat `resolveProvidersForSections()` a mapování v builderu.
5. Volitelně doplnit `aggregates` pro Statistics Factory.

Orchestrace builderu (registry loop, freeze, options) zůstává beze změny.

## Evoluce — Slice 10.5 (ADR-011)

Slice 10.5 zavedl **Contact Data Platform** (`ContactContext`) v `src/features/contacts/context/`. Context Providers a orchestrace se přesunuly z `features/ai` do neutrální platformy.

`ContactAiContext` zůstává **AI read kontrakt** Slice 10 — vzniká projekcí `toContactAiContext()` z `ContactContext`. `buildContactAiContextForTenant()` je tenký wrapper pro zpětnou kompatibilitu.

```
Repositories → Context Providers → ContactContextBuilder → ContactContext
                                                              ├→ mapContactDetailView → UI
                                                              └→ toContactAiContext → ContactAiContext → LLM Adapter
```

Contact Detail nesmí importovat `features/ai` (viz ADR-011). LLM transport vrstva je v [ADR-012](./012-llm-adapter-architecture.md).

### Co Slice 10 neřeší

- LLM integrace (Slice 11 — ADR-012)
- AI UI panel, chat
- Cache, background refresh, telemetry (interface připraven)
- Redakce PII (`includeSensitiveData` — interface připraven, logika v budoucím slicu)

## Důsledky

- Nové AI funkce konzumují `ContactAiContext`, ne repository.
- `IMPLEMENTATION_SEQUENCE.md` — Slice 10 = Context Builder; LLM integrace = další slice.
- Integrační testy: tenant isolation, determinismus, history source.
- Každý nový provider = registry entry + typy + repository rozšíření v jeho doméně.
