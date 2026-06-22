import "server-only";

import { createLlmGateway, defaultLlmGateway, type LlmGateway } from "../llm/gateway/llm-gateway";

export function getLlmGateway(): LlmGateway {
  return defaultLlmGateway;
}

export { createLlmGateway };
export type { LlmGateway };
