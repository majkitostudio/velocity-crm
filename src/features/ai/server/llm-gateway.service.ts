import "server-only";

import { createLlmGateway, type LlmGateway } from "../llm/gateway/llm-gateway";
import { createGatewayTelemetryCostRecorder } from "../llm/gateway/gateway-telemetry-cost-recorder";
import { createCostAccountingMiddleware } from "../llm/gateway/middleware/cost-accounting-middleware";
import { createGatewayTelemetryMiddleware } from "../llm/gateway/middleware/gateway-telemetry-middleware";

let productionGateway: LlmGateway | null = null;

export function getLlmGateway(): LlmGateway {
  if (!productionGateway) {
    productionGateway = createLlmGateway({
      middleware: [
        createGatewayTelemetryMiddleware(),
        createCostAccountingMiddleware(createGatewayTelemetryCostRecorder()),
      ],
    });
  }

  return productionGateway;
}

export function resetLlmGatewayForTests(): void {
  productionGateway = null;
}

export { createLlmGateway };
export type { LlmGateway };
