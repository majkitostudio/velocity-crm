import assert from "node:assert/strict";

import { buildPrompt } from "../../src/features/ai/prompts/registry";
import {
  loadSummaryPromptGoldenAiContext,
  summaryPromptGoldenBuildInput,
} from "../../src/features/ai/prompts/summary/summary-prompt.test-fixture";
import { SUMMARY_PROMPT_LABEL } from "../../src/features/ai/prompts/summary/summary-prompt-version";

async function assertSummaryPromptGolden() {
  const result = buildPrompt(summaryPromptGoldenBuildInput);

  assert.equal(result.promptId, "summary");
  assert.equal(result.promptVersion, 1);
  assert.equal(result.summary, SUMMARY_PROMPT_LABEL);
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0]?.role, "system");
  assert.equal(result.messages[1]?.role, "user");
  assert.match(result.messages[1]?.content ?? "", /Golden Contact/);
  assert.match(result.messages[1]?.content ?? "", /```json/);
}

async function assertDeterministicPromptBuild() {
  const context = loadSummaryPromptGoldenAiContext();
  const input = {
    context,
    taskProfile: "SUMMARY" as const,
    locale: "cs" as const,
    redaction: { includeSensitiveData: true },
  };

  const first = buildPrompt(input);
  const second = buildPrompt(input);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
}

async function main() {
  await assertSummaryPromptGolden();
  await assertDeterministicPromptBuild();
  console.log("prompt-summary-golden: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
