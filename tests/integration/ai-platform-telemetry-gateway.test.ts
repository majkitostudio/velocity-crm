import assert from "node:assert/strict";

import { createLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { gatewayTelemetryStore } from "../../src/features/ai/llm/gateway/gateway-telemetry-store";
import { createGatewayTelemetryCostRecorder } from "../../src/features/ai/llm/gateway/gateway-telemetry-cost-recorder";
import { createCostAccountingMiddleware } from "../../src/features/ai/llm/gateway/middleware/cost-accounting-middleware";
import { createGatewayTelemetryMiddleware } from "../../src/features/ai/llm/gateway/middleware/gateway-telemetry-middleware";
import { buildLlmCompletionRequest } from "../../src/features/ai/llm/request/llm-request-builder";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { toContactAiContext } from "../../src/features/ai/context/mappers/to-contact-ai-context";
import type { ContactContext } from "../../src/features/contacts/context/types/contact-context";

const executionOrder: string[] = [];

function buildMinimalContactContext(): ContactContext {
  return {
    schemaVersion: 1,
    contactId: "contact-gateway-telemetry",
    companyId: "company-gateway-telemetry",
    contact: {
      id: "contact-gateway-telemetry",
      name: "Gateway Telemetry",
      phone: null,
      email: null,
      address: { street: null, city: null, zipCode: null, country: null },
      status: "LEAD",
      source: "MANUAL",
      priority: "NORMAL",
      assignedUser: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
    snapshot: {
      workflow: { failCount: 0, failThreshold: 3, lastCall: null },
      callbacks: { open: [], recentClosed: [] },
      orders: { recent: [] },
      notes: { recent: [] },
      products: { catalog: [], purchased: [], lastPurchased: null },
    },
    history: { activities: [] },
    statistics: {
      totalCalls: 0,
      totalOrders: 0,
      totalOpenCallbacks: 0,
      totalNotes: 0,
      failCount: 0,
      successfulOrderCount: 0,
    },
  };
}

function createInstrumentedGateway() {
  const telemetryMiddleware = createGatewayTelemetryMiddleware();
  const costMiddleware = createCostAccountingMiddleware(createGatewayTelemetryCostRecorder());

  return createLlmGateway({
    middleware: [
      {
        name: "order-telemetry",
        async onResponse(ctx, response) {
          executionOrder.push("telemetry");
          return telemetryMiddleware.onResponse!(ctx, response);
        },
      },
      {
        name: "order-cost",
        async onResponse(ctx, response) {
          executionOrder.push("cost");
          return costMiddleware.onResponse!(ctx, response);
        },
      },
    ],
  });
}

async function assertMiddlewareOrderAndPropagation() {
  gatewayTelemetryStore.reset();
  executionOrder.length = 0;

  const gateway = createInstrumentedGateway();
  const aiContext = toContactAiContext(buildMinimalContactContext());
  const prompt = buildPrompt({
    context: aiContext,
    taskProfile: "SUMMARY",
    locale: "cs",
  });

  const correlationId = "correlation-gateway-1";
  const request = buildLlmCompletionRequest({
    prompt,
    model: { vendor: "fake", modelId: "fake-1" },
    metadata: {
      taskProfile: "SUMMARY",
      companyId: aiContext.companyId,
      contactId: aiContext.contactId,
      correlationId,
    },
  });

  const response = await gateway.complete(request);

  assert.deepEqual(executionOrder, ["telemetry", "cost"]);
  assert.ok(response.usage);

  const snapshot = gatewayTelemetryStore.take(correlationId);
  assert.ok(snapshot);
  assert.equal(snapshot.provider, "fake");
  assert.equal(snapshot.modelId, "fake-1");
  assert.equal(snapshot.promptTokens, response.usage?.inputTokens);
  assert.equal(snapshot.completionTokens, response.usage?.outputTokens);
  assert.equal(snapshot.totalTokens, response.usage?.totalTokens);
  assert.equal(typeof snapshot.gatewayLatencyMs, "number");
}

async function main() {
  await assertMiddlewareOrderAndPropagation();
  console.log("ai-platform-telemetry-gateway: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
