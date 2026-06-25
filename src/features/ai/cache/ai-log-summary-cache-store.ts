import "server-only";

import type { PrismaClient } from "@/src/generated/prisma/client";
import {
  contactSummarySchema,
  type ContactSummary,
} from "@/src/features/ai/prompts/summary/summary-output-schema";

import type { AiCacheStore } from "./ai-cache-store";
import {
  createAiLogCachePersistence,
  type AiLogCachePersistence,
} from "./ai-log-cache-persistence";

export type CreateAiLogSummaryPersistenceOptions = {
  prisma: PrismaClient;
};

export type AiLogSummaryPersistence = AiLogCachePersistence<ContactSummary>;

export function createAiLogSummaryPersistence(
  options: CreateAiLogSummaryPersistenceOptions,
): AiLogSummaryPersistence {
  return createAiLogCachePersistence({
    prisma: options.prisma,
    taskType: "CUSTOMER_SUMMARY",
    taskCategory: "SUMMARY",
    promptId: "summary",
    outputSchema: contactSummarySchema,
  });
}

export function createAiLogSummaryCacheStore(
  options: CreateAiLogSummaryPersistenceOptions,
): AiCacheStore<ContactSummary> {
  return createAiLogSummaryPersistence(options).cacheStore;
}
