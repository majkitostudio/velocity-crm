import type { AiTelemetrySink } from "./ai-telemetry-sink";
import type { AiTaskTelemetryEvent } from "./ai-task-telemetry-event";

export type AiTelemetryRecorder = {
  record(event: AiTaskTelemetryEvent): Promise<void>;
};

export function createAiTelemetryRecorder(sink: AiTelemetrySink): AiTelemetryRecorder {
  return {
    async record(event) {
      await sink.write(event);
    },
  };
}
