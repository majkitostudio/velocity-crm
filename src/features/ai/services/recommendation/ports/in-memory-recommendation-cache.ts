import type { AiCacheStore } from "@/src/features/ai/cache/ai-cache-store";

import type { ContactRecommendation } from "../recommendation.schema";

export function createInMemoryRecommendationCache(): AiCacheStore<ContactRecommendation> {
  const store = new Map<
    string,
    { payload: ContactRecommendation; generatedAt: string; aiLogId?: string }
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
