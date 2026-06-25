import type { AiTaskTelemetryEvent } from "./ai-task-telemetry-event";

export type AiTelemetrySink = {
  write(event: AiTaskTelemetryEvent): Promise<void>;
};

export function createNoopAiTelemetrySink(): AiTelemetrySink {
  return {
    async write() {
      // Test helper — discards events without recording.
    },
  };
}

export function createCollectingAiTelemetrySink(): AiTelemetrySink & {
  readonly events: AiTaskTelemetryEvent[];
  clear(): void;
} {
  const events: AiTaskTelemetryEvent[] = [];

  return {
    get events() {
      return events;
    },
    clear() {
      events.length = 0;
    },
    async write(event) {
      events.push(structuredClone(event));
    },
  };
}
