import type { JsonSchemaDefinition } from "./json-schema";

/** Prepared for future tool calling — not implemented in Slice 11. */
export type LlmToolDefinition = {
  name: string;
  description: string;
  parameters: JsonSchemaDefinition;
};

export type LlmToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};
