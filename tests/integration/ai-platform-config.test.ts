import assert from "node:assert/strict";

import { defaultAiConfig } from "../../src/features/ai/config/default-ai-config";
import { resolveAiConfig } from "../../src/features/ai/config/resolve-ai-config";

async function assertDefaultConfig() {
  const config = resolveAiConfig();
  assert.equal(config.enabled, defaultAiConfig.enabled);
  assert.equal(config.defaultLocale, "cs");
  assert.equal(config.cache.summaryTtlMs, defaultAiConfig.cache.summaryTtlMs);
  assert.equal(config.tasks.SUMMARY.modelPolicyHints?.requireStructuredOutput, true);
}

async function assertEnvOverride() {
  const previous = process.env.AI_GATEWAY_TIMEOUT_MS;
  process.env.AI_GATEWAY_TIMEOUT_MS = "45000";

  try {
    const config = resolveAiConfig();
    assert.equal(config.gateway.defaultTimeoutMs, 45000);
  } finally {
    if (previous === undefined) {
      delete process.env.AI_GATEWAY_TIMEOUT_MS;
    } else {
      process.env.AI_GATEWAY_TIMEOUT_MS = previous;
    }
  }
}

async function main() {
  await assertDefaultConfig();
  await assertEnvOverride();
  console.log("ai-platform-config: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
