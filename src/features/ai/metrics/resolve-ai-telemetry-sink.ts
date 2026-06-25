import { createCollectingAiTelemetrySink } from "./ai-telemetry-sink";
import { createLogAiTelemetrySink } from "./log-ai-telemetry-sink";
import type { AiTelemetrySink } from "./ai-telemetry-sink";

function readTelemetrySinkMode(): "log" | "collect" | "none" {
  const value = process.env.AI_TELEMETRY_SINK?.toLowerCase();
  if (value === "none" || value === "off") {
    return "none";
  }
  if (value === "collect") {
    return "collect";
  }
  return "log";
}

let resolvedSink: AiTelemetrySink | null = null;

export function resolveAiTelemetrySink(): AiTelemetrySink {
  if (resolvedSink) {
    return resolvedSink;
  }

  const mode = readTelemetrySinkMode();

  if (mode === "none") {
    resolvedSink = { async write() {} };
  } else if (mode === "collect") {
    resolvedSink = createCollectingAiTelemetrySink();
  } else {
    resolvedSink = createLogAiTelemetrySink();
  }

  return resolvedSink;
}

export function resetAiTelemetrySinkForTests(): void {
  resolvedSink = null;
}
