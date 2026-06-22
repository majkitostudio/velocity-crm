import type { PipelineAuditLogger } from "../../shared/ai-service-pipeline.types";

let auditLogSequence = 0;

export function createNoopContactSummaryAuditLogger(): PipelineAuditLogger {
  return {
    async recordSuccess() {
      auditLogSequence += 1;
      return { aiLogId: `noop-ai-log-${auditLogSequence}` };
    },
    async recordFailure() {
      // Slice 12.2 — noop audit; real AiLog in 12.9
    },
  };
}
