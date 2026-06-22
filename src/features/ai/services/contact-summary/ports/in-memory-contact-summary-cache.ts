import type { AiCacheStore } from "@/src/features/ai/cache/ai-cache-store";

import type { ContactSummary } from "../contact-summary.schema";

export function createInMemoryContactSummaryCache(): AiCacheStore<ContactSummary> {
  const store = new Map<
    string,
    { payload: ContactSummary; generatedAt: string; aiLogId?: string }
  >();

  return {
    async find(lookup) {
      const entry = store.get(lookup.cacheKey);
      if (!entry) {
        return null;
      }
      return entry;
    },

    async upsert(write) {
      store.set(write.cacheKey, {
        payload: write.payload,
        generatedAt: write.generatedAt,
        aiLogId: write.aiLogId,
      });
    },

    async invalidate(scope) {
      const prefix = `${scope.companyId}:${scope.contactId}:`;
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
          store.delete(key);
        }
      }
    },
  };
}

let sharedCache: AiCacheStore<ContactSummary> | null = null;

export function getInMemoryContactSummaryCache(): AiCacheStore<ContactSummary> {
  if (!sharedCache) {
    sharedCache = createInMemoryContactSummaryCache();
  }
  return sharedCache;
}
