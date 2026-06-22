# ADR-012: LLM Adapter Architecture

**Stav:** Přijato  
**Datum:** 2026-06-21  
**Schváleno:** 2026-06-21  
**Související:** [ADR-010](./010-ai-context-architecture.md), [ADR-011](./011-unified-contact-context-platform.md), [IMPLEMENTATION_SEQUENCE.md](../IMPLEMENTATION_SEQUENCE.md), [TARGET_ARCHITECTURE.md](../TARGET_ARCHITECTURE.md)

## Kontext

Slice 10 zavedl `ContactAiContext` — immutable, deterministický AI read kontrakt. Slice 10.5 (ADR-011) sjednotil načítání dat do **Contact Data Platform** (`ContactContext`); `ContactAiContext` vzniká projekcí `toContactAiContext()` bez změny sémantiky Slice 10.

Další krok je **transport vrstva** mezi `ContactAiContext` a konkrétním LLM poskytovatelem. Bez ní by každá budoucí AI funkce (Summary, Recommendations, Copilot) duplikovala vendor SDK, prompty a error handling.

Slice 11 vytváří **provider-agnostic LLM infrastrukturu**. Neimplementuje AI Summary, UI, streaming ani reálná API volání.

## Rozhodnutí

### Cíl a hranice Slice 11

Slice 11 dodává:

- interní request/response modely
- `LlmGateway` orchestrátor
- `LlmVendorAdapter` interface a registry
- Prompt template kontrakty
- `FakeLlmVendorAdapter` pro testy
- stub vendor adaptéry (bez SDK)

Slice 11 **nedodává**: AI panel, chat UI, OpenAI/Anthropic/Ollama API, streaming implementaci, tool calling logiku, RAG, embeddings, background jobs, retry/cache implementaci.

### Terminologie — Context Provider vs Vendor Adapter

| Pojem | Vrstva | Odpovědnost |
|-------|--------|-------------|
| **Context Provider** | `contacts/context/` (ADR-011) | Načtení dat kontaktu z repository |
| **Vendor Adapter** | `ai/llm/adapters/` (tento ADR) | Transport k LLM API |

Nikdy nemíchat. Business a UI nesmí importovat vendor SDK.

### Vrstvení

```
ContactContext (ADR-011)
  ↓ toContactAiContext()
ContactAiContext (ADR-010)
  ↓
Prompt Builder                    ← verzované šablony
  ↓
Llm Request Builder               ← sestaví LlmCompletionRequest
  ↓
Llm Gateway (+ Middleware chain)  ← dispatch, normalizace, hooks
  ↓
Llm Vendor Adapter                ← OpenAI / Anthropic / Ollama / …
  ↓
Llm Response Normalizer
  ↓
LlmCompletionResponse
```

| Vrstva | Odpovědnost | Nesmí |
|--------|-------------|-------|
| `ContactAiContext` | Data kontrakt | Znát LLM, prompty |
| **Prompt Builder** | `PromptBuildInput` → messages + metadata | Volat API, vybírat model |
| **Llm Request Builder** | Prompt výsledek + `LlmModelRef` → `LlmCompletionRequest` | Obsahovat prompt copy |
| **Llm Gateway** | Orchestrace, middleware, structured wrapper | Znát `ContactAiContext`, business logiku |
| **Llm Vendor Adapter** | Encode/decode pro vendor API | Persistovat logy, PII policy |
| **AI Services** (Slice 12+) | Task orchestrace + `AiLog` | Importovat vendor SDK |

Prompt Builder je **mimo** Gateway i mimo Vendor Adapter.

### Umístění v projektu

```
src/features/ai/
  context/              # Slice 10 — mapper + typy (beze změny)
  prompts/              # verzované šablony + registry
  llm/
    types/              # request, response, model, stream, tools
    errors/             # LlmError hierarchie
    adapters/           # LlmVendorAdapter + vendor registry
    gateway/            # LlmGateway + middleware + normalizer
    models/             # model registry (katalog)
    policy/             # model policy (výběr)
    cost/               # cost management kontrakty
    request/            # LlmRequestBuilder
  services/             # Slice 12+ — AiSummaryService, …
  server/               # tenké fasády (auth, tenant)
```

`src/features/contacts/context/` zůstává beze změny ve Slice 11.

### LlmGateway — veřejné API

```typescript
interface LlmGateway {
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse>;
  completeStructured<T>(
    request: LlmCompletionRequest,
    schema: z.ZodSchema<T>,
  ): Promise<LlmStructuredResponse<T>>;
  stream?(request: LlmCompletionRequest): AsyncIterable<LlmStreamEvent>; // interface only
}
```

Jeden request model (`LlmCompletionRequest`) pokrývá single-turn i multi-turn (`messages[]`), structured output i budoucí tools. `completeStructured` je convenience wrapper nad `complete` + Zod validace.

### LlmVendorAdapter

```typescript
interface LlmVendorAdapter {
  readonly vendor: LlmVendor;
  readonly capabilities: LlmVendorCapabilities;
  complete(request: LlmCompletionRequest): Promise<LlmVendorRawResponse>;
  stream?(request: LlmCompletionRequest): AsyncIterable<LlmStreamEvent>;
}
```

Vendor adaptér:

- přijímá `LlmCompletionRequest` (interní DTO)
- vrací `LlmVendorRawResponse` (opaque pro gateway)
- mapuje vendor chyby → `LlmError`
- **nesmí** logovat persistenci, obsahovat prompt engineering ani znát `ContactAiContext`

Registry: `llm/adapters/vendor-registry.ts` — gateway iteruje registry, ne hardcoded třídy.

### Request a Response modely

**`LlmCompletionRequest`** (provider-agnostic):

- `model: LlmModelRef` (`{ vendor, modelId }`)
- `messages: readonly LlmMessage[]`
- `temperature`, `maxOutputTokens`, `responseFormat`
- `tools?` (interface only)
- `metadata?` (taskProfile, promptId, promptVersion, contactId, companyId, correlationId)

**`LlmCompletionResponse`** (provider-agnostic):

- `content`, `finishReason`, `model`, `usage?`, `toolCalls?`

Business vrstva **nikdy** nevidí OpenAI `ChatCompletion` ani HTTP detaily.

### Model Registry vs Model Policy

Dvě oddělené vrstvy — **katalog** vs **rozhodování**.

#### Model Registry (`llm/models/`)

**Co ví:** jaké modely existují a jaké mají vlastnosti.

```typescript
type LlmModelRef = { vendor: LlmVendor; modelId: string };

type LlmModelRegistryEntry = {
  ref: LlmModelRef;
  displayName: string;
  capabilities: LlmVendorCapabilities;
  contextWindowTokens?: number;
  /** Architektonická příprava — cost management */
  costPerInputToken?: number;
  costPerOutputToken?: number;
  deprecated?: boolean;
};
```

Registry je **statický katalog** (env / config file ve Slice 11). Neobsahuje business pravidla.

#### Model Policy (`llm/policy/`)

**Co ví:** který model použít pro daný úkol a kontext.

```typescript
type LlmTaskProfile =
  | "SUMMARY"
  | "RECOMMENDATION"
  | "CALL_PREP"
  | "COPILOT"
  | "GENERAL";

type ModelPolicyInput = {
  taskProfile: LlmTaskProfile;
  companyId: string;
  /** Budoucí: role, budget tier, feature flags */
  hints?: {
    preferLowCost?: boolean;
    requireStructuredOutput?: boolean;
  };
};

type ModelPolicyResult = {
  model: LlmModelRef;
  fallback?: LlmModelRef;
  reason: string; // pro log/debug, ne pro UI
};

function resolveModelForTask(input: ModelPolicyInput): ModelPolicyResult;
```

**Pravidla:**

- Business služby znají pouze `LlmTaskProfile`, nikdy `"gpt-4o"` ani `"claude-3-5-sonnet"`.
- Policy čte z Registry, ale **nerozšiřuje** Registry o rozhodovací logiku.
- Slice 11: env-based policy (`LLM_SUMMARY_VENDOR`, `LLM_SUMMARY_MODEL`). Per-company DB policy až v SaaS slici.

### Gateway Middleware

`LlmGateway` podporuje **řetězitelný middleware** — rozšiřovací bod bez změny veřejného API.

```typescript
type LlmGatewayMiddleware = {
  name: string;
  onRequest?(ctx: LlmMiddlewareContext, request: LlmCompletionRequest): Promise<LlmCompletionRequest>;
  onResponse?(ctx: LlmMiddlewareContext, response: LlmCompletionResponse): Promise<LlmCompletionResponse>;
  onError?(ctx: LlmMiddlewareContext, error: LlmError): Promise<never | LlmCompletionResponse>;
};

type LlmMiddlewareContext = {
  correlationId: string;
  startedAt: number;
  taskProfile?: LlmTaskProfile;
  companyId?: string;
};
```

Slice 11: **prázdný middleware chain** + interface. Budoucí middleware:

| Middleware | Účel |
|------------|------|
| `RetryMiddleware` | retryable `LlmError` |
| `TelemetryMiddleware` | latency, vendor, model |
| `CacheMiddleware` | response cache (hash request) |
| `CostAccountingMiddleware` | token → cost attribution |
| `RateLimitMiddleware` | per-tenant throttling |

Middleware běží **v gateway**, ne v vendor adaptéru ani v AI Service.

### Cost Management

Architektonická příprava na správu nákladů a tokenů — Slice 11 **neimplementuje** billing ani limity.

```typescript
type LlmUsageCost = {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
  model: LlmModelRef;
};

type LlmCostEvent = {
  correlationId: string;
  companyId: string;
  userId?: string;
  taskProfile: LlmTaskProfile;
  usage: LlmUsageCost;
  occurredAt: string;
};

interface LlmCostRecorder {
  record(event: LlmCostEvent): Promise<void>;
}
```

**Tok:**

1. `LlmCompletionResponse.usage` z normalizeru
2. `CostAccountingMiddleware` (budoucí) spočítá `estimatedCostUsd` z `LlmModelRegistryEntry.costPer*`
3. `LlmCostRecorder` persistuje (budoucí tabulka / analytics) — **ne** v vendor adaptéru
4. `AiLog.metadata` může obsahovat `usage` + `estimatedCostUsd` (Slice 12 schema)

Slice 11: typy + no-op `LlmCostRecorder`.

### Prompt Builder a PromptBuildInput

Prompt Builder **nesmí** zakládat pouze na `ContactAiContext`. Vstup je `PromptBuildInput`:

```typescript
type PromptBuildInput = {
  /** Primární datový zdroj — AI read kontrakt */
  context: ContactAiContext;

  /** Lokalizace výstupu */
  locale?: "cs" | "en";

  /** Task-specific omezení bez změny context builderu */
  contextView?: {
    maxHistoryItems?: number;
    includeNoteBodies?: boolean;
  };

  /** Budoucí doplňkové zdroje mimo ContactAiContext */
  supplements?: {
    operatorInstructions?: string;
    campaignContext?: string;
    /** Email/SMS draft — Slice budoucí */
    communicationSnippet?: string;
  };

  /** Policy hints pro šablonu */
  taskProfile: LlmTaskProfile;

  /** Sanitizace — předává se z AI Service policy */
  redaction?: {
    includeSensitiveData: boolean;
  };
};
```

**Proč ne pouze `ContactAiContext`:**

- Budoucí Email/SMS Assistant přidá `supplements` bez rozšíření `ContactAiContext`
- Operator instructions jsou runtime input, ne součást kontextu kontaktu
- `locale` a `contextView` patří do prompt vrstvy, ne do context platformy
- Redakce PII je explicitní policy na hranici AI Service → Prompt Builder

```typescript
type PromptBuildResult = {
  messages: readonly LlmMessage[];
  promptId: PromptTemplateId;
  promptVersion: number;
  summary: string; // krátký popis pro AiLog — ne celý prompt
};
```

Šablony: `prompts/templates/<task>/v1.ts`, registry v `prompts/registry.ts`. Golden snapshot testy na `PromptBuildResult`.

### Structured output

```
ZodSchema / JsonSchemaDefinition
  ↓
LlmCompletionRequest.responseFormat
  ↓
LlmGateway.completeStructured()
  ↓
Vendor Adapter (překlad schema per vendor)
  ↓
JSON parse + Zod.validate → LlmStructuredResponse<T>
```

Selhání validace → `LlmSchemaValidationError` (ne vendor error).

### Error handling

Hierarchie `LlmError extends DomainError`:

| Třída | Retryable |
|-------|-----------|
| `LlmTimeoutError` | ano |
| `LlmRateLimitError` | ano |
| `LlmProviderUnavailableError` | ano |
| `LlmQuotaExceededError` | ne |
| `LlmUnsupportedModelError` | ne |
| `LlmInvalidResponseError` | ne |
| `LlmSchemaValidationError` | ne |
| `LlmContentFilterError` | ne |
| `LlmProviderNotConfiguredError` | ne |

Vendor adaptér mapuje HTTP/SDK chyby. Business catchuje `LlmError`, ne OpenAI exceptions. Retry přes `RetryMiddleware` (budoucí).

### AI Logging

| Co logovat | Kde |
|------------|-----|
| taskProfile, model, promptId, promptVersion, promptSummary, output, usage | `AiLog` (AI Service, Slice 12) |
| latency, vendor, correlationId | `AiLog.metadata` nebo telemetry middleware |
| estimatedCostUsd | `AiLog.metadata` / `LlmCostRecorder` |

| Co nelogovat |
|--------------|
| Celý `ContactAiContext` |
| Celý prompt s PII |
| API klíče, raw HTTP |

Vendor adaptér **nepersistuje** `AiLog`.

### Bezpečnost

- PII redakce: `PromptBuildInput.redaction` + budoucí `AiContextSanitizer` před Prompt Builderem
- Tenant isolation: `assertContactAccess` před načtením kontextu (existuje)
- API klíče: pouze env/server config, nikdy v request metadata
- Prompt injection: system/user oddělení v šablonách; serializovaný context jako strukturovaný user block

### Streaming a Tool Calling

Slice 11: **pouze typy** (`LlmStreamEvent`, `LlmToolDefinition`, `LlmToolCall`, `capabilities`).

`LlmGateway.stream?` — stejný `LlmCompletionRequest`, jiná transport metoda. AI Services volají `stream()` nebo `complete()` bez změny request modelu.

### Závislostní pravidla (rozšíření ADR-011)

```
contacts/context → repositories        ✅
ai/context       → contacts/context    ✅
ai/prompts       → ai/context types    ✅
ai/llm           → ai/prompts types    ✅
ai/services      → ai/llm + ai/prompts ✅
contacts/*       → ai                  ❌
ai/llm           → contacts/repositories ❌
```

`ContactAiContext` a `ContactContext` se ve Slice 11 **nemění**.

### Připravenost na budoucí AI funkce

| Funkce | Slice |
|--------|-------|
| AI Summary, Recommendations, Copilot UI | Slice 12+ (viz [ADR-013](./013-ai-contact-summary-service.md)) |
| Email/SMS Assistant (`supplements` v PromptBuildInput) | Slice budoucí |
| Retry, cache, rate limit middleware | Slice budoucí |
| Per-company model policy + cost limits | SaaS slice |

## Co Slice 11 neřeší

- OpenAI, Anthropic, Ollama API volání
- AI Summary, UI panel, chat
- Streaming implementace
- Tool/function calling logika, MCP, multi-agent
- RAG, embeddings, vector DB
- Background jobs
- Retry, cache, rate limiting **implementace** (pouze middleware interface)
- Cost persistence a billing enforcement
- `AiLog` schema migrace (připraveno v kontraktech, implementace [ADR-013](./013-ai-contact-summary-service.md))

## Důsledky

- Nový ADR-012 je gate pro implementaci `src/features/ai/llm/`
- `IMPLEMENTATION_SEQUENCE.md` — Slice 11 = LLM infra; Slice 12 = AI Services + UI
- `TARGET_ARCHITECTURE.md` — doplnit `ai/llm/`, `ai/prompts/`
- ADR-010 zůstává platný; diagram LLM vrstvy je v tomto ADR
- Integrační testy: `FakeLlmVendorAdapter` + gateway, bez network

## Související rozhodnutí

- [ADR-010](./010-ai-context-architecture.md) — `ContactAiContext` kontrakt
- [ADR-011](./011-unified-contact-context-platform.md) — `ContactContext` platforma
