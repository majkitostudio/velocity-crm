import type { z } from "zod";

import {
  LlmInvalidResponseError,
  LlmSchemaValidationError,
  LlmStreamingNotSupportedError,
  isLlmError,
} from "../errors/llm-errors";
import { resolveLlmVendorAdapter } from "../adapters/vendor-registry";
import {
  createCorrelationId,
  type LlmGatewayMiddleware,
  type LlmMiddlewareContext,
} from "./llm-gateway-middleware";
import { normalizeLlmVendorResponse } from "./llm-response-normalizer";
import type { LlmCompletionRequest } from "../types/llm-request";
import type {
  LlmCompletionResponse,
  LlmStructuredResponse,
} from "../types/llm-response";
import type { LlmStreamEvent } from "../types/llm-stream";

export type LlmGateway = {
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse>;
  completeStructured<T>(
    request: LlmCompletionRequest,
    schema: z.ZodSchema<T>,
  ): Promise<LlmStructuredResponse<T>>;
  stream(request: LlmCompletionRequest): AsyncIterable<LlmStreamEvent>;
};

export type CreateLlmGatewayOptions = {
  middleware?: readonly LlmGatewayMiddleware[];
};

async function runRequestMiddleware(
  ctx: LlmMiddlewareContext,
  request: LlmCompletionRequest,
  middleware: readonly LlmGatewayMiddleware[],
): Promise<LlmCompletionRequest> {
  let current = request;

  for (const layer of middleware) {
    if (layer.onRequest) {
      current = await layer.onRequest(ctx, current);
    }
  }

  return current;
}

async function runResponseMiddleware(
  ctx: LlmMiddlewareContext,
  response: LlmCompletionResponse,
  middleware: readonly LlmGatewayMiddleware[],
): Promise<LlmCompletionResponse> {
  let current = response;

  for (const layer of middleware) {
    if (layer.onResponse) {
      current = await layer.onResponse(ctx, current);
    }
  }

  return current;
}

export function createLlmGateway(options?: CreateLlmGatewayOptions): LlmGateway {
  const middleware = options?.middleware ?? [];

  return {
    async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
      const ctx: LlmMiddlewareContext = {
        correlationId: request.metadata?.correlationId ?? createCorrelationId(),
        startedAt: Date.now(),
        taskProfile: request.metadata?.taskProfile,
        companyId: request.metadata?.companyId,
      };

      let preparedRequest = request;

      try {
        preparedRequest = await runRequestMiddleware(ctx, request, middleware);

        const adapter = resolveLlmVendorAdapter(preparedRequest.model.vendor);
        const raw = await adapter.complete(preparedRequest);
        let response = normalizeLlmVendorResponse(preparedRequest, raw);

        response = await runResponseMiddleware(ctx, response, middleware);

        return response;
      } catch (error) {
        if (isLlmError(error)) {
          for (const layer of middleware) {
            if (layer.onError) {
              const recovered = await layer.onError(ctx, error);
              if (recovered) {
                return recovered;
              }
            }
          }
        }

        throw error;
      }
    },

    async completeStructured<T>(
      request: LlmCompletionRequest,
      schema: z.ZodSchema<T>,
    ): Promise<LlmStructuredResponse<T>> {
      const jsonRequest: LlmCompletionRequest = {
        ...request,
        responseFormat: request.responseFormat ?? { type: "json" },
      };

      const raw = await this.complete(jsonRequest);

      let parsed: unknown;

      try {
        parsed = JSON.parse(raw.content);
      } catch {
        throw new LlmInvalidResponseError(
          "LLM response is not valid JSON",
          request.model.vendor,
        );
      }

      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        throw new LlmSchemaValidationError(
          validated.error.message,
          request.model.vendor,
        );
      }

      return {
        data: validated.data,
        raw,
      };
    },

    async *stream(request: LlmCompletionRequest): AsyncIterable<LlmStreamEvent> {
      const adapter = resolveLlmVendorAdapter(request.model.vendor);

      if (!adapter.stream || !adapter.capabilities.streaming) {
        throw new LlmStreamingNotSupportedError(request.model.vendor);
      }

      yield* adapter.stream(request);
    },
  };
}

export const defaultLlmGateway = createLlmGateway();
