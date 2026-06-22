import type { LlmModelRef, LlmTaskProfile } from "../types/llm-model";

export type LlmUsageCost = {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
  model: LlmModelRef;
};

export type LlmCostEvent = {
  correlationId: string;
  companyId: string;
  userId?: string;
  taskProfile: LlmTaskProfile;
  usage: LlmUsageCost;
  occurredAt: string;
};

export type LlmCostRecorder = {
  record(event: LlmCostEvent): Promise<void>;
};

export const noopLlmCostRecorder: LlmCostRecorder = {
  async record() {
    // Slice 11 — no-op; persistence in future slice
  },
};

export function estimateUsageCostUsd(input: {
  model: LlmModelRef;
  inputTokens: number;
  outputTokens: number;
  costPerInputToken?: number;
  costPerOutputToken?: number;
}): number | undefined {
  if (
    input.costPerInputToken === undefined ||
    input.costPerOutputToken === undefined
  ) {
    return undefined;
  }

  return (
    input.inputTokens * input.costPerInputToken +
    input.outputTokens * input.costPerOutputToken
  );
}
