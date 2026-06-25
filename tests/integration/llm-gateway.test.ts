import assert from "node:assert/strict";

import { z } from "zod";

import { createLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { LlmProviderNotConfiguredError } from "../../src/features/ai/llm/errors/llm-errors";
import { resolveModelForTask } from "../../src/features/ai/llm/policy/resolve-model-for-task";
import { buildLlmCompletionRequest } from "../../src/features/ai/llm/request/llm-request-builder";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { contactSummarySchema } from "../../src/features/ai/prompts/summary/summary-output-schema";
import { buildFakeContactSummaryResponse } from "../../src/features/ai/prompts/summary/fake-contact-summary-response";
import { contactRecommendationSchema } from "../../src/features/ai/prompts/recommendation/recommendation-output-schema";
import { buildFakeRecommendationResponse } from "../../src/features/ai/prompts/recommendation/fake-recommendation-response";
import { toContactAiContext } from "../../src/features/ai/context/mappers/to-contact-ai-context";
import type { ContactContext } from "../../src/features/contacts/context/types/contact-context";

function buildMinimalContactContext(): ContactContext {
  return {
    schemaVersion: 1,
    contactId: "contact-llm-test",
    companyId: "company-llm-test",
    contact: {
      id: "contact-llm-test",
      name: "LLM Test Contact",
      phone: "+420601000001",
      email: "llm@test.local",
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

async function assertFakeGatewayComplete() {
  const gateway = createLlmGateway();
  const aiContext = toContactAiContext(buildMinimalContactContext());
  const policy = resolveModelForTask({
    taskProfile: "SUMMARY",
    companyId: aiContext.companyId,
    hints: { preferLowCost: true },
  });

  const prompt = buildPrompt({
    context: aiContext,
    taskProfile: "SUMMARY",
    locale: "cs",
  });

  const request = buildLlmCompletionRequest({
    prompt,
    model: policy.model,
    metadata: {
      taskProfile: "SUMMARY",
      companyId: aiContext.companyId,
      contactId: aiContext.contactId,
    },
  });

  const first = await gateway.complete(request);
  const second = await gateway.complete(request);

  assert.equal(first.content, second.content);
  assert.equal(first.finishReason, "stop");
  assert.equal(first.model.vendor, "fake");
  assert.ok(first.usage);
}

async function assertStructuredOutput() {
  const gateway = createLlmGateway();
  const schema = z.object({ draft: z.string() });

  const result = await gateway.completeStructured(
    {
      model: { vendor: "fake", modelId: "fake-1" },
      messages: [{ role: "user", content: "test" }],
      metadata: { taskProfile: "GENERAL" },
    },
    schema,
  );

  assert.ok(result.data.draft.length > 0);
  assert.equal(result.raw.finishReason, "stop");
}

async function assertSummaryStructuredOutput() {
  const gateway = createLlmGateway();
  const contactId = "contact-llm-structured";

  const result = await gateway.completeStructured(
    {
      model: { vendor: "fake", modelId: "fake-1" },
      messages: [{ role: "user", content: "summary" }],
      responseFormat: { type: "json" },
      metadata: { taskProfile: "SUMMARY", contactId },
    },
    contactSummarySchema,
  );

  assert.deepEqual(result.data, buildFakeContactSummaryResponse(contactId));
}

async function assertRecommendationStructuredOutput() {
  const gateway = createLlmGateway();
  const contactId = "contact-llm-recommendation";

  const result = await gateway.completeStructured(
    {
      model: { vendor: "fake", modelId: "fake-1" },
      messages: [{ role: "user", content: "recommendation" }],
      responseFormat: { type: "json" },
      metadata: { taskProfile: "RECOMMENDATION", contactId },
    },
    contactRecommendationSchema,
  );

  assert.deepEqual(result.data, buildFakeRecommendationResponse(contactId));
}

async function assertStubVendorThrows() {
  const gateway = createLlmGateway();

  await assert.rejects(
    () =>
      gateway.complete({
        model: { vendor: "openai", modelId: "gpt-4o" },
        messages: [{ role: "user", content: "hi" }],
      }),
    LlmProviderNotConfiguredError,
  );
}

async function main() {
  await assertFakeGatewayComplete();
  await assertStructuredOutput();
  await assertSummaryStructuredOutput();
  await assertRecommendationStructuredOutput();
  await assertStubVendorThrows();
  console.log("llm-gateway: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
