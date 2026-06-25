import type { LlmCostRecorder } from "../cost/llm-cost-recorder";
import { gatewayTelemetryStore } from "./gateway-telemetry-store";

export function createGatewayTelemetryCostRecorder(): LlmCostRecorder {
  return {
    async record(event) {
      gatewayTelemetryStore.merge(event.correlationId, {
        provider: event.usage.model.vendor,
        modelId: event.usage.model.modelId,
        promptTokens: event.usage.inputTokens,
        completionTokens: event.usage.outputTokens,
        totalTokens: event.usage.inputTokens + event.usage.outputTokens,
        estimatedCostUsd: event.usage.estimatedCostUsd,
      });
    },
  };
}
