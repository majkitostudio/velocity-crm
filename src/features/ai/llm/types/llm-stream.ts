import type { LlmCompletionResponse } from "./llm-response";
import type { LlmError } from "../errors/llm-errors";

/** Prepared for future streaming — not implemented in Slice 11. */
export type LlmStreamEvent =
  | { type: "delta"; content: string }
  | { type: "done"; response: LlmCompletionResponse }
  | { type: "error"; error: LlmError };
