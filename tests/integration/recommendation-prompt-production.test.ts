import assert from "node:assert/strict";

import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { buildRecommendationPrompt } from "../../src/features/ai/prompts/recommendation/recommendation-prompt.builder";
import {
  formatRecommendationPromptLabel,
  RECOMMENDATION_PROMPT_LABEL,
  RECOMMENDATION_PROMPT_VERSION,
} from "../../src/features/ai/prompts/recommendation/recommendation-prompt-version";
import { contactRecommendationJsonSchema } from "../../src/features/ai/prompts/recommendation/recommendation-output-schema";
import {
  loadSummaryPromptGoldenAiContext,
} from "../../src/features/ai/prompts/summary/summary-prompt.test-fixture";

async function assertPromptDeterminism() {
  const input = {
    context: loadSummaryPromptGoldenAiContext(),
    taskProfile: "RECOMMENDATION" as const,
    locale: "cs" as const,
    redaction: { includeSensitiveData: true },
  };

  const first = buildRecommendationPrompt(input);
  const second = buildRecommendationPrompt(input);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
}

async function assertPromptVersion() {
  const result = buildRecommendationPrompt({
    context: loadSummaryPromptGoldenAiContext(),
    taskProfile: "RECOMMENDATION",
    locale: "cs",
    redaction: { includeSensitiveData: true },
  });

  assert.equal(result.promptVersion, RECOMMENDATION_PROMPT_VERSION);
  assert.equal(result.summary, RECOMMENDATION_PROMPT_LABEL);
  assert.equal(result.summary, formatRecommendationPromptLabel());
  assert.equal(result.promptId, "recommendation");
}

async function assertStructuredOutputInstructions() {
  const result = buildRecommendationPrompt({
    context: loadSummaryPromptGoldenAiContext(),
    taskProfile: "RECOMMENDATION",
    locale: "cs",
    redaction: { includeSensitiveData: true },
  });

  const systemContent = result.messages[0]?.content ?? "";
  assert.match(systemContent, /JSON/i);
  assert.match(systemContent, /"primaryAction"/);
  assert.match(systemContent, /"confidence"/);
  assert.match(systemContent, /halucinac/i);
  assert.doesNotMatch(systemContent, /```json/);

  assert.equal(contactRecommendationJsonSchema.type, "object");
  assert.deepEqual(contactRecommendationJsonSchema.required, [
    "primaryAction",
    "alternatives",
    "risks",
    "followUpTasks",
    "confidence",
  ]);
}

async function assertRegistryUsesProductionTemplate() {
  const result = buildPrompt({
    context: loadSummaryPromptGoldenAiContext(),
    taskProfile: "RECOMMENDATION",
    locale: "cs",
    redaction: { includeSensitiveData: true },
  });

  assert.equal(result.promptId, "recommendation");
  assert.equal(result.summary, "recommendation@v1");
}

async function main() {
  await assertPromptDeterminism();
  await assertPromptVersion();
  await assertStructuredOutputInstructions();
  await assertRegistryUsesProductionTemplate();
  console.log("recommendation-prompt-production: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
