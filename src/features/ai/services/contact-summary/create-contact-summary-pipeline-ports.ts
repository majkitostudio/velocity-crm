import "server-only";

import { createAiLogSummaryPersistence } from "@/src/features/ai/cache/ai-log-summary-cache-store";
import { createContactAccessAuthorizer } from "@/src/features/ai/server/contact-access-authorizer";
import { prisma } from "@/src/server/db";

import type { ContactSummary } from "./contact-summary.schema";
import { createAiPipelinePorts } from "../shared/create-ai-pipeline-ports";

export function createContactSummaryPipelinePorts() {
  const persistence = createAiLogSummaryPersistence({ prisma });
  return createAiPipelinePorts<ContactSummary>({
    cacheStore: persistence.cacheStore,
    auditLogger: persistence.auditLogger,
    authorizer: createContactAccessAuthorizer(),
  });
}
