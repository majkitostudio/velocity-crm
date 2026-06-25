/**
 * @deprecated Use `AiTaskTelemetryEvent` and `AiTelemetryRecorder` from Slice 13.4.
 */
export type {
  AiTelemetryOutcome as PromptMetricOutcome,
  AiTaskTelemetryEvent as PromptMetricEvent,
} from "./ai-task-telemetry-event";

/** @deprecated Use `AiTelemetryRecorder` instead. */
export type PromptMetricsRecorder = import("./ai-telemetry-recorder").AiTelemetryRecorder;
