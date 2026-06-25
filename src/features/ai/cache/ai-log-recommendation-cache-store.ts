import "server-only";

import type { PrismaClient } from "@/src/generated/prisma/client";
import {
  contactRecommendationSchema,
  type ContactRecommendation,
} from "@/src/features/ai/prompts/recommendation/recommendation-output-schema";

import type { AiCacheStore } from "./ai-cache-store";
import {
  createAiLogCachePersistence,
  type AiLogCachePersistence,
} from "./ai-log-cache-persistence";

export type CreateAiLogRecommendationPersistenceOptions = {
  prisma: PrismaClient;
};

export type AiLogRecommendationPersistence = AiLogCachePersistence<ContactRecommendation>;

export function createAiLogRecommendationPersistence(
  options: CreateAiLogRecommendationPersistenceOptions,
): AiLogRecommendationPersistence {
  return createAiLogCachePersistence({
    prisma: options.prisma,
    taskType: "NEXT_ACTION",
    taskCategory: "RECOMMENDATION",
    promptId: "recommendation",
    outputSchema: contactRecommendationSchema,
  });
}

export function createAiLogRecommendationCacheStore(
  options: CreateAiLogRecommendationPersistenceOptions,
): AiCacheStore<ContactRecommendation> {
  return createAiLogRecommendationPersistence(options).cacheStore;
}
