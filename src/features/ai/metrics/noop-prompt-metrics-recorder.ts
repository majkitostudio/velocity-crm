import { createNoopAiTelemetrySink } from "./ai-telemetry-sink";
import { createAiTelemetryRecorder } from "./ai-telemetry-recorder";

/** @deprecated Use `createNoopAiTelemetrySink()` or `createCollectingAiTelemetrySink()` instead. */
export const noopPromptMetricsRecorder = createAiTelemetryRecorder(createNoopAiTelemetrySink());
