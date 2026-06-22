import type { LlmModelRef, LlmTaskProfile } from "./llm-model";
import type { LlmMessage } from "./llm-message";
import type { JsonSchemaDefinition } from "./json-schema";
import type { LlmToolDefinition } from "./llm-tools";

export type LlmResponseFormat =
  | { type: "text" }
  | { type: "json"; schema?: JsonSchemaDefinition };

export type LlmCompletionRequestMetadata = {
  taskProfile?: LlmTaskProfile;
  promptId?: string;
  promptVersion?: number;
  contactId?: string;
  companyId?: string;
  correlationId?: string;
};

export type LlmCompletionRequest = {
  model: LlmModelRef;
  messages: readonly LlmMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: LlmResponseFormat;
  tools?: readonly LlmToolDefinition[];
  metadata?: LlmCompletionRequestMetadata;
  abortSignal?: AbortSignal;
};
