import assert from "node:assert/strict";

import { buildPrompt } from "../../src/features/ai/prompts/registry";
import { serializeContactAiContext } from "../../src/features/ai/prompts/serializers/serialize-contact-ai-context";
import { buildSummaryPrompt } from "../../src/features/ai/prompts/summary/summary-prompt.builder";
import {
  loadSummaryPromptGoldenAiContext,
  summaryPromptGoldenBuildInput,
} from "../../src/features/ai/prompts/summary/summary-prompt.test-fixture";
import {
  formatSummaryPromptLabel,
  SUMMARY_PROMPT_LABEL,
  SUMMARY_PROMPT_VERSION,
} from "../../src/features/ai/prompts/summary/summary-prompt-version";
import { contactSummaryJsonSchema } from "../../src/features/ai/prompts/summary/summary-output-schema";

async function assertPromptDeterminism() {
  const input = {
    context: loadSummaryPromptGoldenAiContext(),
    taskProfile: "SUMMARY" as const,
    locale: "cs" as const,
    redaction: { includeSensitiveData: true },
  };

  const first = buildSummaryPrompt(input);
  const second = buildSummaryPrompt(input);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
}

async function assertPromptVersion() {
  const result = buildSummaryPrompt({
    context: loadSummaryPromptGoldenAiContext(),
    taskProfile: "SUMMARY",
    locale: "cs",
    redaction: { includeSensitiveData: true },
  });

  assert.equal(result.promptVersion, SUMMARY_PROMPT_VERSION);
  assert.equal(result.summary, SUMMARY_PROMPT_LABEL);
  assert.equal(result.summary, formatSummaryPromptLabel());
  assert.equal(result.promptId, "summary");
}

async function assertStructuredOutputInstructions() {
  const result = buildSummaryPrompt({
    context: loadSummaryPromptGoldenAiContext(),
    taskProfile: "SUMMARY",
    locale: "cs",
    redaction: { includeSensitiveData: true },
  });

  const systemContent = result.messages[0]?.content ?? "";
  assert.match(systemContent, /JSON/i);
  assert.match(systemContent, /"confidence"/);
  assert.match(systemContent, /"recommendations"/);
  assert.match(systemContent, /"warnings"/);
  assert.match(systemContent, /halucinac/i);
  assert.doesNotMatch(systemContent, /```json/);

  assert.equal(contactSummaryJsonSchema.type, "object");
  assert.deepEqual(contactSummaryJsonSchema.required, [
    "summary",
    "recommendations",
    "warnings",
    "confidence",
  ]);
}

async function assertSerializationDeterminism() {
  const context = loadSummaryPromptGoldenAiContext();
  const options = { includeSensitiveData: true, includeNoteBodies: true };

  const first = serializeContactAiContext(context, options);
  const second = serializeContactAiContext(context, options);

  assert.equal(first, second);
  assert.match(first, /Golden Contact/);
}

async function assertRegistryGoldenPrompt() {
  const result = buildPrompt(summaryPromptGoldenBuildInput);

  assert.equal(result.summary, SUMMARY_PROMPT_LABEL);
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0]?.role, "system");
  assert.equal(result.messages[1]?.role, "user");
  assert.match(result.messages[1]?.content ?? "", /Golden Contact/);
  assert.match(result.messages[1]?.content ?? "", /```json/);
}

async function main() {
  await assertPromptDeterminism();
  await assertPromptVersion();
  await assertStructuredOutputInstructions();
  await assertSerializationDeterminism();
  await assertRegistryGoldenPrompt();
  console.log("summary-prompt-production: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
