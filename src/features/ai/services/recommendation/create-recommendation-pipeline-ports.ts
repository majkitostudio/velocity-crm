import "server-only";

import { createAiLogRecommendationPersistence } from "@/src/features/ai/cache/ai-log-recommendation-cache-persistence";
import { prisma } from "@/src/server/db";

import type { ContactRecommendation } from "./recommendation.schema";
import { createAiPipelinePorts } from "../shared/create-ai-pipeline-ports";

export function createRecommendationPipelinePorts() {
  const persistence = createAiLogRecommendationPersistence({ prisma });
  return createAiPipelinePorts<ContactRecommendation>({
    cacheStore: persistence.cacheStore,
    auditLogger: persistence.auditLogger,
  });
}
