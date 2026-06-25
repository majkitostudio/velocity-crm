import assert from "node:assert/strict";

import { createAiTelemetryRecorder } from "../../src/features/ai/metrics/ai-telemetry-recorder";
import { createCollectingAiTelemetrySink } from "../../src/features/ai/metrics/ai-telemetry-sink";
import type { AiTaskTelemetryEvent } from "../../src/features/ai/metrics/ai-task-telemetry-event";

const baseEvent: AiTaskTelemetryEvent = {
  correlationId: "correlation-recorder-1",
  companyId: "company-recorder",
  userId: "user-recorder",
  serviceId: "contact-summary",
  taskCategory: "SUMMARY",
  provider: "fake",
  model: "fake-1",
  promptId: "summary",
  promptVersion: 1,
  source: "LIVE",
  outcome: "success",
  latencyMs: 25,
  promptTokens: 10,
  completionTokens: 5,
  totalTokens: 15,
  estimatedCostUsd: 0.0001,
  occurredAt: "2024-01-01T00:00:00.000Z",
};

async function assertRecorderWritesToSink() {
  const sink = createCollectingAiTelemetrySink();
  const recorder = createAiTelemetryRecorder(sink);

  await recorder.record(baseEvent);

  assert.equal(sink.events.length, 1);
  assert.deepEqual(sink.events[0], baseEvent);
}

async function assertUndefinedOptionalValues() {
  const sink = createCollectingAiTelemetrySink();
  const recorder = createAiTelemetryRecorder(sink);

  const cacheEvent: AiTaskTelemetryEvent = {
    ...baseEvent,
    source: "CACHE",
    provider: "openai",
    model: "gpt-4o-mini",
    promptTokens: undefined,
    completionTokens: undefined,
    totalTokens: undefined,
    estimatedCostUsd: undefined,
  };

  await recorder.record(cacheEvent);

  assert.equal(sink.events[0]?.source, "CACHE");
  assert.equal(sink.events[0]?.promptTokens, undefined);
  assert.equal(sink.events[0]?.estimatedCostUsd, undefined);
}

async function assertSourceClassification() {
  const sink = createCollectingAiTelemetrySink();
  const recorder = createAiTelemetryRecorder(sink);

  await recorder.record({ ...baseEvent, source: "LIVE" });
  await recorder.record({ ...baseEvent, source: "CACHE", provider: undefined, model: undefined });

  assert.equal(sink.events[0]?.source, "LIVE");
  assert.equal(sink.events[1]?.source, "CACHE");
}

async function main() {
  await assertRecorderWritesToSink();
  await assertUndefinedOptionalValues();
  await assertSourceClassification();
  console.log("ai-telemetry-recorder: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
