import assert from "node:assert/strict";

import { createLlmGateway } from "../../src/features/ai/llm/gateway/llm-gateway";
import { buildRecommendationPrompt } from "../../src/features/ai/prompts/recommendation/recommendation-prompt.builder";
import {
  contactRecommendationSchema,
  contactRecommendationJsonSchema,
  recommendedActionSchema,
  recommendedActionTypeSchema,
} from "../../src/features/ai/prompts/recommendation/recommendation-output-schema";
import { buildFakeRecommendationResponse } from "../../src/features/ai/prompts/recommendation/fake-recommendation-response";
import { loadSummaryPromptGoldenAiContext } from "../../src/features/ai/prompts/summary/summary-prompt.test-fixture";

const ZOD_TOP_LEVEL_KEYS = Object.keys(contactRecommendationSchema.shape).sort();
const JSON_TOP_LEVEL_KEYS = [...(contactRecommendationJsonSchema.required ?? [])].sort();

function assertFakeResponseMatchesZod() {
  const dto = buildFakeRecommendationResponse("contact-schema-test");
  const parsed = contactRecommendationSchema.parse(dto);
  assert.equal(parsed.primaryAction.actionType, "CALL");
  assert.equal(parsed.alternatives.length, 1);
  assert.equal(parsed.confidence, 0.82);
}

function assertJsonSchemaRequiredFields() {
  assert.equal(contactRecommendationJsonSchema.type, "object");
  assert.deepEqual(JSON_TOP_LEVEL_KEYS, ZOD_TOP_LEVEL_KEYS);
}

function assertZodJsonSchemaEnumAlignment() {
  const jsonActionTypes =
    contactRecommendationJsonSchema.properties?.primaryAction?.properties?.actionType?.enum ?? [];
  assert.deepEqual(
    [...recommendedActionTypeSchema.options].sort(),
    [...jsonActionTypes].sort(),
  );
}

function assertPromptDescribesDtoShape() {
  const prompt = buildRecommendationPrompt({
    context: loadSummaryPromptGoldenAiContext(),
    taskProfile: "RECOMMENDATION",
    locale: "cs",
    redaction: { includeSensitiveData: false },
  });

  const systemContent = prompt.messages[0]?.content ?? "";
  for (const field of ZOD_TOP_LEVEL_KEYS) {
    assert.match(systemContent, new RegExp(`"${field}"`));
  }
}

async function assertFakeGatewayStructuredOutputMatchesDto() {
  const contactId = "contact-schema-gateway";
  const gateway = createLlmGateway();
  const result = await gateway.completeStructured(
    {
      model: { vendor: "fake", modelId: "fake-1" },
      messages: [{ role: "user", content: "recommendation" }],
      responseFormat: { type: "json", schema: contactRecommendationJsonSchema },
      metadata: { taskProfile: "RECOMMENDATION", contactId },
    },
    contactRecommendationSchema,
  );

  assert.deepEqual(result.data, buildFakeRecommendationResponse(contactId));
}

function assertZodRejectsInvalidPrimaryAction() {
  const invalid = buildFakeRecommendationResponse("contact-schema-test");
  const result = contactRecommendationSchema.safeParse({
    ...invalid,
    primaryAction: {
      ...invalid.primaryAction,
      title: "bad",
    },
  });
  assert.equal(result.success, false);
}

function assertRecommendedActionSchema() {
  const action = buildFakeRecommendationResponse("contact-schema-test").primaryAction;
  assert.equal(recommendedActionSchema.safeParse(action).success, true);
}

async function main() {
  assertFakeResponseMatchesZod();
  assertJsonSchemaRequiredFields();
  assertZodJsonSchemaEnumAlignment();
  assertPromptDescribesDtoShape();
  await assertFakeGatewayStructuredOutputMatchesDto();
  assertZodRejectsInvalidPrimaryAction();
  assertRecommendedActionSchema();
  console.log("recommendation-schema: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
