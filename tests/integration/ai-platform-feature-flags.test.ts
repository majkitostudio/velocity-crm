import assert from "node:assert/strict";

import { createEnvAiFeatureFlags } from "../../src/features/ai/flags/env-ai-feature-flags";
import { listEnabledAiServiceDescriptors } from "../../src/features/ai/registry/list-enabled-ai-services";

const FLAG_CTX = {
  companyId: "company-1",
  userId: "user-1",
  userRole: "OPERATOR" as const,
};

async function assertMasterSwitch() {
  const previous = process.env.AI_ENABLED;
  process.env.AI_ENABLED = "false";

  try {
    const flags = createEnvAiFeatureFlags();
    assert.equal(flags.isEnabled("ai.contact_summary", FLAG_CTX), false);
    assert.equal(listEnabledAiServiceDescriptors(FLAG_CTX, flags).length, 0);
  } finally {
    if (previous === undefined) {
      delete process.env.AI_ENABLED;
    } else {
      process.env.AI_ENABLED = previous;
    }
  }
}

async function assertContactSummaryFlag() {
  const previous = process.env.AI_FEATURE_CONTACT_SUMMARY;
  process.env.AI_FEATURE_CONTACT_SUMMARY = "true";
  process.env.AI_ENABLED = "true";

  try {
    const flags = createEnvAiFeatureFlags();
    assert.equal(flags.isEnabled("ai.contact_summary", FLAG_CTX), true);
    const enabled = listEnabledAiServiceDescriptors(FLAG_CTX, flags);
    assert.ok(enabled.some((descriptor) => descriptor.id === "contact-summary"));
  } finally {
    if (previous === undefined) {
      delete process.env.AI_FEATURE_CONTACT_SUMMARY;
    } else {
      process.env.AI_FEATURE_CONTACT_SUMMARY = previous;
    }
    delete process.env.AI_ENABLED;
  }
}

async function main() {
  await assertMasterSwitch();
  await assertContactSummaryFlag();
  console.log("ai-platform-feature-flags: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
