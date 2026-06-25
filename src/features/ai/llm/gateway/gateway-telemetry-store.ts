import type { LlmVendor } from "../types/llm-vendor";

export type GatewayTelemetrySnapshot = {
  provider?: LlmVendor;
  modelId?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  gatewayLatencyMs?: number;
};

const snapshots = new Map<string, GatewayTelemetrySnapshot>();

export const gatewayTelemetryStore = {
  merge(correlationId: string, patch: GatewayTelemetrySnapshot): void {
    const current = snapshots.get(correlationId) ?? {};
    snapshots.set(correlationId, { ...current, ...patch });
  },

  take(correlationId: string): GatewayTelemetrySnapshot | undefined {
    const value = snapshots.get(correlationId);
    snapshots.delete(correlationId);
    return value;
  },

  clear(correlationId: string): void {
    snapshots.delete(correlationId);
  },

  reset(): void {
    snapshots.clear();
  },
};
