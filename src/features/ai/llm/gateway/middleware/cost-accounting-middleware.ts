import {
  estimateUsageCostUsd,
  noopLlmCostRecorder,
  type LlmCostRecorder,
} from "../../cost/llm-cost-recorder";
import { findLlmModelRegistryEntry } from "../../models/llm-model-registry";
import type { LlmGatewayMiddleware } from "../llm-gateway-middleware";

export function createCostAccountingMiddleware(
  recorder: LlmCostRecorder = noopLlmCostRecorder,
): LlmGatewayMiddleware {
  return {
    name: "cost-accounting",
    async onResponse(ctx, response) {
      if (!ctx.companyId || !ctx.taskProfile || !response.usage) {
        return response;
      }

      const registryEntry = findLlmModelRegistryEntry(response.model);

      await recorder.record({
        correlationId: ctx.correlationId,
        companyId: ctx.companyId,
        taskProfile: ctx.taskProfile,
        occurredAt: new Date().toISOString(),
        usage: {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          model: response.model,
          estimatedCostUsd: estimateUsageCostUsd({
            model: response.model,
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            costPerInputToken: registryEntry?.costPerInputToken,
            costPerOutputToken: registryEntry?.costPerOutputToken,
          }),
        },
      });

      return response;
    },
  };
}
