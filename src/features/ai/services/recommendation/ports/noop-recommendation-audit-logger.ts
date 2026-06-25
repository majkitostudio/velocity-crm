import type { PipelineAuditLogger } from "../../shared/ai-service-pipeline.types";

let auditLogSequence = 0;

export function createNoopRecommendationAuditLogger(): PipelineAuditLogger {
  return {
    async recordSuccess() {
      auditLogSequence += 1;
      return { aiLogId: `noop-rec-ai-log-${auditLogSequence}` };
    },
    async recordFailure() {
      // noop audit for isolated tests
    },
  };
}
