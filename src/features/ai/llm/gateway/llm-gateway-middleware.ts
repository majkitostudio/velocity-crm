import type { LlmCompletionRequest } from "../types/llm-request";
import type { LlmCompletionResponse } from "../types/llm-response";
import type { LlmError } from "../errors/llm-errors";
import type { LlmTaskProfile } from "../types/llm-model";

export type LlmMiddlewareContext = {
  correlationId: string;
  startedAt: number;
  taskProfile?: LlmTaskProfile;
  companyId?: string;
};

export type LlmGatewayMiddleware = {
  name: string;
  onRequest?(
    ctx: LlmMiddlewareContext,
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionRequest>;
  onResponse?(
    ctx: LlmMiddlewareContext,
    response: LlmCompletionResponse,
  ): Promise<LlmCompletionResponse>;
  onError?(
    ctx: LlmMiddlewareContext,
    error: LlmError,
  ): Promise<never | LlmCompletionResponse>;
};

export function createCorrelationId(): string {
  return `llm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
