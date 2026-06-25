# ADR-014: AI Recommendation Service

**Stav:** Návrh (čeká na schválení)  
**Datum:** 2026-06-25  
**Související:** [ADR-010](./010-ai-context-architecture.md), [ADR-011](./011-unified-contact-context-platform.md), [ADR-012](./012-llm-adapter-architecture.md), [ADR-013](./013-ai-contact-summary-service.md), [IMPLEMENTATION_SEQUENCE.md](../IMPLEMENTATION_SEQUENCE.md), [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)

## Kontext

Slice 12 dodal první produkční AI službu — **Contact Summary** — jako vzorovou implementaci nad AI platformou (Slice 10–12). Slice 13 má ověřit, že platforma skutečně podporuje **druhou službu** bez redesignu infrastruktury.

**AI Recommendation Service** doporučuje operátorovi další postup při práci s kontaktem (priorita akce, důvod, rizika, timing, follow-up úkoly). Není to rozšíření Summary — jde o samostatný `AiTaskService` se vlastním DTO, promptem, cache klíčem a UI.

Tento ADR **neimplementuje kód**. Definuje architekturu, platformní mezery a implementační plán.

---

## Cíl

```
Operátor otevře kontakt
  → ContactContext → ContactAiContext
  → AiContextSanitizer (RECOMMENDATION profile)
  → Prompt Builder (recommendation@v1)
  → LlmGateway → LLM
  → ContactRecommendation DTO → AiLog → RecommendationViewModel → UI panel
```

Stejný tok jako Summary; jiná služba, jiný výstup, jiný panel.

---

## Rozhodnutí — struktura výstupu (DTO)

Summary vrací `recommendations: string[]` jako vedlejší pole. Recommendation jako samostatná služba potřebuje **akční strukturu** vhodnou pro operátora v call centru.

### `ContactRecommendation` (Zod source of truth)

```typescript
type RecommendedActionType =
  | "CALL"
  | "SCHEDULE_CALLBACK"
  | "CREATE_ORDER"
  | "SEND_EMAIL"
  | "SEND_SMS"
  | "WAIT"
  | "REVIEW_DATA"
  | "ESCALATE";

type RecommendedActionPriority = "HIGH" | "MEDIUM" | "LOW";

type RecommendedAction = {
  actionType: RecommendedActionType;
  title: string;              // 5–120 znaků, operátorský headline
  rationale: string;          // 10–500 znaků, proč právě teď
  priority: RecommendedActionPriority;
  suggestedContactAt?: string; // ISO 8601, volitelný timing
};

type ContactRecommendation = {
  primaryAction: RecommendedAction;
  alternatives: readonly RecommendedAction[];  // max 3
  risks: readonly string[];                    // max 3, 5–300 znaků
  followUpTasks: readonly string[];            // max 5, konkrétní checklist
  confidence: number;                          // 0–1
};
```

### Zdůvodnění

| Pole | Proč |
|------|------|
| `primaryAction` + `alternatives` | Operátor potřebuje jednu jasnou prioritu, ne plochý seznam vět |
| `actionType` | Budoucí propojení s Call Workflow / Callbacks (UI může zobrazit ikonu / CTA) |
| `suggestedContactAt` | Relevantní pro `CALL_LATER` / `SCHEDULE_CALL` kontext |
| `risks` | Oddělené od Summary `warnings` — zaměřené na rozhodování, ne na popis stavu |
| `followUpTasks` | Konkrétní checklist (např. „ověřit doručení objednávky“) |
| `confidence` | Konzistentní s Summary; metriky a badge |

### `RecommendationViewModel`

```typescript
type RecommendationViewModel = {
  status: "ready";
  source: "LIVE" | "CACHE";
  primaryAction: { /* z DTO */ };
  alternatives: readonly /* ... */;
  risks: readonly string[];
  followUpTasks: readonly string[];
  confidence: number;
  metadata: {
    generatedAt: string;
    promptLabel: string;       // "recommendation@v1"
    correlationId: string;
    aiLogId?: string;
  };
};
```

ViewModel **neobsahuje** sanitizovaný context — pouze DTO + metadata (stejná disciplína jako Summary).

---

## Ověření platformy (Slice 10–12)

| Komponenta | Lze beze změny? | Hodnocení |
|------------|-----------------|-----------|
| **AiTaskService** | **ANO** | Generický kontrakt `TDto, TViewModel`; Recommendation = nová implementace |
| **runAiServicePipeline()** | **ANO** | Service-agnostický orchestrátor; `RECOMMENDATION` už mapuje na prompt `"recommendation"` |
| **AiCacheStore** | **ANO** (interface) | `find/upsert/invalidate` generické; klíč obsahuje `serviceId` |
| **AiLog** | **ANO** (tabulka) | Append-only audit; `taskType` + `metadata.cacheKey` |
| **Prompt Builder** | **ČÁSTEČNĚ** | Registry má stub `recommendation@v1`; potřeba produkční prompt (jako `summary@v1`) |
| **LLM Gateway** | **ANO** | `completeStructured` + JSON schema |
| **Capability Matrix** | **ANO** | Descriptor `recommendation` už v registry s `structuredOutput: true` |
| **Feature Flags** | **ANO** | Registry `ai.<service>.{enabled,refresh,auto_generate}` (Slice 13.0) |
| **AI Configuration** | **ANO** | `defaultCacheTtlMs` + per-task override; env alias `AI_CACHE_SUMMARY_TTL_MS` |
| **Metrics** | **ANO** | `PromptMetricEvent` je service-agnostický; `recommendationCount` pole připraveno |
| **AI Service Registry** | **ANO** | Descriptor `recommendation` + `taskCategory` na všech službách |
| **AiContextSanitizer** | **NE** | Profil `RECOMMENDATION` háže `NotImplementedError` |
| **AiLog cache impl.** | **ANO** | `createAiLogCachePersistence<T>()` + tenký Summary wrapper (Slice 13.0) |
| **Pipeline ports factory** | **ANO** | `createAiPipelinePorts()` + per-service wrapper (Slice 13.0) |
| **Fake LLM adapter** | **ANO** | `fake-response-registry.ts` per `LlmTaskProfile` (Slice 13.0) |
| **AiLogMetadata** | **ANO** | `promptId: PromptTemplateId`, `taskCategory` (Slice 13.0) |

### Minimální platformní úpravy (Slice 13.0 — před implementací služby)

Tyto změny jsou **obecné** — těží z nich Call Prep, Email Draft, SMS Draft, Copilot.

#### P1 — `createAiLogCachePersistence<T>()` (zobecnění cache)

Extrahovat z `ai-log-summary-cache-store.ts`:

```text
src/features/ai/cache/
  ai-log-cache-persistence.ts    # generická factory
  ai-log-summary-cache-store.ts  # tenký wrapper / deprecated alias
```

Parametry factory:

- `taskType: AiTaskType` — z descriptoru, ne hardcoded
- `promptId: PromptTemplateId` — z descriptoru
- `outputSchema: ZodSchema<T>` — per service
- `prisma`

`AiLogMetadata.promptId` → `PromptTemplateId` (ne literal `"summary"`).

**Proč obecné:** Email Draft, Call Prep, další cached služby.

#### P2 — `createAiPipelinePorts<TDto>()` (zobecnění wiring)

```text
src/features/ai/services/shared/create-ai-pipeline-ports.ts
```

Sdílená factory skládající clock, gateway, sanitizer, metrics, **per-service cache persistence** a audit.

Per-service tenký wrapper:

```text
services/recommendation/create-recommendation-pipeline-ports.ts
  → createAiPipelinePorts({ serviceId: "recommendation", ... })
```

**Proč obecné:** Každá nová služba = 5–10 řádků wiring, ne kopie 90 řádků.

#### P3 — Feature flag pattern pro refresh

Přidat `ai.recommendation.refresh` do `AI_FEATURE_FLAG_KEYS` (stejný pattern jako Summary).

**Proč obecné:** Všechny cached služby s force refresh.

#### P4 — Cache config pojmenování ✅ (Slice 13.0)

```typescript
cache: {
  defaultCacheTtlMs: number;        // dříve summaryTtlMs
  defaultCacheHardExpireMs: number; // dříve summaryHardExpireMs
  useAiLogAsCache: boolean;
}
// per-task override: tasks[profile].cacheTtlMs / cacheHardExpireMs
```

Migrace: env alias `AI_CACHE_SUMMARY_TTL_MS` → `defaultCacheTtlMs` (zpětná kompatibilita).

**Proč obecné:** Recommendation může mít kratší TTL než Summary.

#### P5 — AiTaskType pro Recommendation

Registry descriptor `recommendation.taskType` změnit z `CUSTOMER_SUMMARY` na **`NEXT_ACTION`**.

Prisma enum `NEXT_ACTION` už existuje. Audit filtry budou srozumitelnější.

**Proč obecné:** Call Prep, Copilot akce — sémanticky odlišné od „summary“.

---

## AiRecommendationService

### Umístění

```text
src/features/ai/services/recommendation/
  recommendation.service.ts          # AiTaskService impl.
  recommendation.schema.ts           # Zod + JSON schema export
  recommendation.types.ts            # RecommendationViewModel
  generate-recommendation.ts         # executor → runAiServicePipeline
  get-recommendation-service.ts      # factory singleton
  create-recommendation-pipeline-ports.ts
```

### Chování služby

| Aspekt | Hodnota |
|--------|---------|
| `descriptor.id` | `"recommendation"` (už v registry) |
| `taskProfile` | `RECOMMENDATION` |
| `taskType` | `NEXT_ACTION` (po P5) |
| `featureFlag` | `ai.recommendation` |
| `supportsCaching` | `true` |
| `sanitizerProfile` | `RECOMMENDATION` |
| Context options | `includeHistory: true`, `includeStatistics: true`, `maxHistoryItems: 30` (širší než Summary — pattern detection) |
| Context hash | `computeContactContextHash()` — **sdílený** se Summary (stejný business kontext) |
| Model policy | `requireStructuredOutput: true`, `preferLowCost: true` (dev/fake) |

### Cache strategie

- **Fáze 1:** stejný mechanismus jako Summary — `AiLog` append-only, lookup `metadata.cacheKey`
- Cache key: `companyId:contactId:recommendation:contextHash:...` — **odlišný `serviceId`**, žádná kolize se Summary
- `force: true` → bypass cache, nový AiLog záznam (stejná disciplína jako Slice 12.7)
- **Fáze 2:** `AiRecommendationCache` tabulka — až při N>10k řádků (ADR-013)

### Audit

- Append-only `AiLog`; refresh = nový řádek, ne update
- `taskType: NEXT_ACTION`, `promptSummary: "recommendation@v1"`
- Metadata: plný `cacheKey`, `contextHash`, `correlationId`, `serviceId`

### Metrics

Pipeline již volá `metricsRecorder.record()`. Po Slice 12.8 (Telemetry):

- `recommendationCount` = `alternatives.length + 1`
- `confidence` z DTO
- `serviceId: "recommendation"`

---

## Prompt — `recommendation@v1`

### Umístění

```text
src/features/ai/prompts/recommendation/
  recommendation-output-schema.ts
  recommendation-prompt-v1.ts
  fake-recommendation-response.ts
  recommendation-prompt-version.ts
```

### Požadavky

- Produční system prompt (cs/en) — operátor call centra, konkrétní akce
- Serializace contextu přes existující `serializeContactAiContextForPrompt`
- Output schema description v promptu (jako Summary)
- Golden test `prompt-recommendation-golden.test.ts`
- Fake adapter: `buildFakeRecommendationResponse(contactId)` — deterministický validní JSON

Stub v `prompts/templates/general/v1.ts` **nahradit** produkční šablonou (ne rozšiřovat stub).

---

## Sanitizer — profil `RECOMMENDATION`

### Rozhodnutí

Implementovat **v Slice 13.1** (současně se službou, ne dříve bez kontextu).

### Navrhované chování

| `includeSensitiveData` | Chování |
|------------------------|---------|
| `false` (default) | Stejná PII redakce jako SUMMARY **+** zachovat časové údaje callbacků (pro timing doporučení) |
| `true` | Plná data — ADMIN + config flag |

**Odlišnost od SUMMARY:** Recommendation potřebuje vědět *kdy* volat zpět — `scheduledAt` callbacků nesmí být null, ale `note` zůstává redacted.

---

## Feature Flags

| Flag | Default (MVP) | Účel |
|------|---------------|------|
| `ai.enabled` | env | Globální kill switch |
| `ai.recommendation` | `false` | Zobrazit panel + povolit generování |
| `ai.recommendation.refresh` | `true` (když recommendation on) | Force refresh tlačítko + action guard |

Env: `AI_FEATURE_RECOMMENDATION`, `AI_FEATURE_RECOMMENDATION_REFRESH`.

---

## UI integrace

### Umístění — AI Workspace (doporučeno)

**Nerozdělovat sidebar na dva nezávislé sloty.** Zavést kompozitní server wrapper v `app/` route:

```text
app/(crm)/contacts/[contactId]/
  → sidebarSlot={
      <ContactAiWorkspace
        contactId={...}
        summaryEnabled={...}
        recommendationEnabled={...}
        summaryRefreshEnabled={...}
        recommendationRefreshEnabled={...}
      />
    }
```

```text
src/features/ai/components/
  contact-ai-workspace.tsx       # client — skládá panely
  contact-ai-summary-panel.tsx     # existující (beze změny kontraktu)
  contact-ai-recommendation-panel.tsx  # nový
```

`ContactDetailPage` **nemění** API — stále `sidebarSlot?: ReactNode`. `contacts/` neimportuje `features/ai`.

### Vizuální odlišení od Summary

| Aspekt | Summary | Recommendation |
|--------|---------|----------------|
| Nadpis | „AI shrnutí“ | „AI doporučení“ |
| Ikona / accent | neutrální zinc | modrý/indigo accent border |
| Primární obsah | odstavec textu | **akční karta** (title + rationale + priority badge) |
| Sekundární | doporučení jako bullet list | alternativy jako menší karty |
| Source badge | LIVE / CACHE | LIVE / CACHE (sdílená komponenta) |
| CTA | Generovat / Obnovit | Generovat doporučení / Obnovit doporučení |

### Server Action

```text
src/features/ai/actions/generate-contact-recommendation.action.ts
```

```typescript
generateContactRecommendationAction(contactId: string, force?: boolean)
  → buildContactSummaryExecuteInput(...)  // přejmenovat na buildAiServiceExecuteInput
  → generateRecommendation(input)
```

**Poznámka platformy:** `buildContactSummaryExecuteInput` by měl být přejmenován na `buildAiServiceExecuteInput` (obecný helper) — Slice 13.0.

### UX disciplína (zkušenost ze Slice 12.7)

- Refresh: panel **neztratí** obsah během loadingu
- Spinner na refresh tlačítku, ne přepnutí do empty state
- `useTransition` + `inFlightRef` — stejný pattern

### Spuštění

- Manuální tlačítko (ne auto-generate v MVP)
- Feature flag skrývá celý Recommendation panel
- Summary a Recommendation **nezávislé** — lze mít jen jedno zapnuté

---

## Registrace v AI Service Registry

Descriptor **už existuje** v `ai-service-registry.ts`. Při implementaci:

1. Aktualizovat `taskType` → `NEXT_ACTION`
2. Ověřit `defaultPromptVersion: 1` synchronní s `recommendation@v1`
3. **Nepřidávat** runtime `register()` — registry zůstává immutable

`getRecommendationService()` — factory analogická k `getContactSummaryService()`.

---

## Capability requirements & model policy

Z registry (beze změny):

```typescript
modelRequirements: {
  structuredOutput: true,
  jsonSchema: true,
  streaming: false,
  toolCalling: false,
  vision: false,
}
```

Model policy (`resolveModelForTask`):

- Production: profil `RECOMMENDATION` z `aiConfig.tasks.RECOMMENDATION`
- Dev/test: `preferLowCost: true` → fake model (stejný pattern jako Summary)

Capability Matrix: `resolveCompatibleModel(descriptor, policy)` — beze změny.

---

## Implementační plán (po schválení ADR)

| Fáze | Slice | Úkol |
|------|-------|------|
| **13.0** | Platform | ✅ P1–P8 platformní generalizace (`AiLogCachePersistence<T>`, `createAiPipelinePorts`, feature flag registry, `defaultCacheTtlMs`, `AiTaskCategory`, fake registry, `buildAiServiceExecuteInput`, workspace types) |
| **13.1** | Service | `AiRecommendationService`, DTO, prompt `recommendation@v1`, sanitizer RECOMMENDATION |
| **13.2** | Integration | Fake adapter, cache integrační testy, E2E |
| **13.3** | UI | `ContactAiWorkspace`, Recommendation panel, Server Action, Playwright |
| **13.4** | Telemetry | Prompt Metrics enrichment (pokud 12.8 ještě není hotové) |

### Definition of Done — Slice 13

- [ ] Recommendation jako druhý `AiTaskService` bez změny `runAiServicePipeline`
- [ ] Vlastní DTO, ViewModel, prompt, sanitizer
- [ ] Cache přes zobecněný `AiLogCachePersistence`
- [ ] Feature flags `ai.recommendation` + `.refresh`
- [ ] UI v AI Workspace; `contacts/` AI-agnostický
- [ ] Integrační + E2E testy
- [ ] Platformní generalizace (P1–P5) — žádný Summary-specific hack v Recommendation

---

## Alternativy

| Alternativa | Pro | Proti |
|-------------|-----|-------|
| Recommendation jako rozšíření Summary DTO | Méně LLM volání | Porušuje single responsibility; jiný cache lifecycle |
| Samostatný sidebar slot per služba | Jednoduché | N škáluje špatně; duplicitní layout logika |
| **AI Workspace compositor (doporučeno)** | Škálovatelné pro Copilot panel; jeden sidebar slot | Tenká nová komponenta |
| Duplikovat pipeline ports per služba | Rychlé | Technický dluh; Copilot = třetí kopie |

---

## Důsledky

- Nový ADR-014 (tento dokument)
- `IMPLEMENTATION_SEQUENCE.md` — Slice 13
- `TARGET_ARCHITECTURE.md` — `services/recommendation/`, `ContactAiWorkspace`
- **Žádná změna** ADR-010, 011, 012 kontraktů
- **Minimální změny** ADR-013 platformních detailů (cache factory, metadata typ)

---

## Závěrečná odpověď

> **Dokáže být Recommendation implementována pouze jako další AiTaskService nad existující platformou?**

**ANO — s podmínkou Slice 13.0 (platformní generalizace P1–P5).**

Bez úprav platformy by Recommendation musela:
- duplikovat `createContactSummaryPipelinePorts`,
- forkovat `AiLogSummaryCacheStore`,
- obcházet neimplementovaný sanitizer,
- spoléhat na nefunkční fake JSON.

To by byl **lokální hack**, ne druhá služba.

Po P1–P5 se znovu použije:

| Vrstva | Znovupoužití |
|--------|--------------|
| `AiTaskService` | nová impl. |
| `runAiServicePipeline` | beze změny |
| `AiCacheStore` + `AiLogCachePersistence` | zobecněná factory |
| Prompt Builder + registry | nový `recommendation@v1` |
| LLM Gateway + Capability Matrix | beze změny |
| Feature Flags + Config | +1 refresh flag, config rename |
| Metrics | beze změny |
| Contact AI Context | beze změny |
| UI pattern | nový panel, sdílený workspace |

**Slice 10–12 kontrakty se nemění.** Mění se pouze **implementační detaily**, které byly legitímně Summary-specific při první službě.

---

## Platform Validation

### 1. Potvrdila Recommendation, že architektura Slice 10–12 je dostatečně obecná?

**Z větší části ANO.** Abstrakce (`AiTaskService`, pipeline, registry, flags, gateway) jsou správně navržené. První produkční služba odhalila **implementační coupling** v cache, ports factory a metadata — ne chybu v abstrakci.

### 2. Existuje část platformy, kterou by bylo vhodné ještě zobecnit?

**ANO** — viz P1–P5. Priorita před implementací Recommendation:

1. `AiLogCachePersistence<T>` (kritické)
2. `createAiPipelinePorts()` (kritické)
3. `buildAiServiceExecuteInput` rename (kosmetické, ale důležité pro čitelnost)
4. Feature flag refresh pattern
5. Cache config pojmenování

### 3. Je někde patrné, že platforma byla navržena primárně pro Contact Summary?

**ANO, na implementační vrstvě** (ne na abstrakci):

| Místo | Projev |
|-------|--------|
| `ai-log-summary-cache-store.ts` | Název + `ContactSummary` schema |
| `create-contact-summary-pipeline-ports.ts` | Summary-specific factory |
| `AiLogMetadata.promptId` | literal `"summary"` |
| `ai-config.cache.summaryTtlMs` | pojmenování |
| `contact-summary-ui.ts` | pattern OK, název specifický |
| Fake adapter | jen Summary JSON |

Registry, pipeline, `AiTaskService` — **nejsou** Summary-specific.

### 4. Pokud by po Recommendation následoval Copilot nebo Email Draft, musela by se platforma znovu měnit?

| Služba | Po P1–P5 | Další požadavek |
|--------|----------|----------------|
| **Call Prep** | Nový `AiTaskService` + prompt | Sanitizer `CALL_PREPARATION` |
| **Email/SMS Draft** | Nový service; `supportsCaching: false` | Možná delší output schema |
| **Copilot** | **NE** přes stávající pipeline | Streaming path v pipeline (ADR-013: `supportsStreaming`); nový UI pattern (chat) |

Copilot je první služba, která **vyžaduje rozšíření pipeline** (streaming branch) — ne duplikaci Summary.

### 5. Co bych upravil dříve, než začneme implementovat další AI služby?

1. **Slice 13.0 platform generalization** — blokující pro čistou druhou službu
2. **Slice 12.8 Telemetry** — noop metrics dnes; bez metrik nevidíme náklady Recommendation vs Summary
3. **`buildAiServiceExecuteInput`** — rename dříve, než přibude třetí action
4. **`ContactAiWorkspace`** — zavést při Recommendation, ne až u Copilot
5. **AiTaskType sémantika** — sjednotit v deskriptorech dříve, než audit roste

---

## Schválení

| Otázka | Návrh |
|--------|-------|
| Recommendation jako druhý `AiTaskService` | **Navrhováno** |
| DTO struktura s `primaryAction` | **Navrhováno** |
| AI Workspace compositor | **Navrhováno** |
| Platform P1–P5 před service impl. | **Navrhováno** |
| `taskType: NEXT_ACTION` pro Recommendation | **Navrhováno** |
