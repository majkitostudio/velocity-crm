import type { AiTelemetrySink } from "./ai-telemetry-sink";
import type { AiTaskTelemetryEvent } from "./ai-task-telemetry-event";

export function createLogAiTelemetrySink(
  log: (message: string) => void = console.info.bind(console),
): AiTelemetrySink {
  return {
    async write(event: AiTaskTelemetryEvent) {
      log(`[ai-telemetry] ${JSON.stringify(event)}`);
    },
  };
}
