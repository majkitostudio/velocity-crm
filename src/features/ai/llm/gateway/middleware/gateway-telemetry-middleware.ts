import { gatewayTelemetryStore } from "../gateway-telemetry-store";
import type { LlmGatewayMiddleware } from "../llm-gateway-middleware";

export function createGatewayTelemetryMiddleware(): LlmGatewayMiddleware {
  return {
    name: "gateway-telemetry",
    async onResponse(ctx, response) {
      gatewayTelemetryStore.merge(ctx.correlationId, {
        provider: response.model.vendor,
        modelId: response.model.modelId,
        promptTokens: response.usage?.inputTokens,
        completionTokens: response.usage?.outputTokens,
        totalTokens: response.usage?.totalTokens,
        gatewayLatencyMs: Date.now() - ctx.startedAt,
      });

      return response;
    },
  };
}
