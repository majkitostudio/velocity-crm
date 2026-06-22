import type {
  AiCacheInvalidateScope,
  AiCacheLookup,
  AiCacheWrite,
  CachedAiPayload,
} from "./ai-cache.types";

export type AiCacheStore<TPayload> = {
  find(lookup: AiCacheLookup): Promise<CachedAiPayload<TPayload> | null>;
  upsert(write: AiCacheWrite<TPayload>): Promise<void>;
  invalidate(scope: AiCacheInvalidateScope): Promise<void>;
};
