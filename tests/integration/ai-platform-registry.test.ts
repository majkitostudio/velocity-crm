import assert from "node:assert/strict";

import {
  AI_SERVICE_DESCRIPTORS,
  getAiServiceDescriptor,
  listAiServiceDescriptors,
} from "../../src/features/ai/registry/ai-service-registry";

async function assertImmutableRegistry() {
  const descriptor = getAiServiceDescriptor("contact-summary");
  assert.equal(descriptor.displayName, "AI shrnutí kontaktu");
  assert.equal(descriptor.defaultPromptVersion, 1);
  assert.equal(descriptor.modelRequirements.structuredOutput, true);

  assert.throws(() => {
    (descriptor as { displayName: string }).displayName = "mutated";
  });

  assert.throws(() => {
    (AI_SERVICE_DESCRIPTORS as Record<string, unknown>)["contact-summary"] = descriptor;
  });
}

async function assertDescriptorCatalog() {
  const descriptors = listAiServiceDescriptors();
  assert.ok(descriptors.length >= 6);
  assert.ok(descriptors.some((entry) => entry.id === "copilot"));
  assert.ok(descriptors.every((entry) => entry.displayName.length > 0));
}

async function main() {
  await assertImmutableRegistry();
  await assertDescriptorCatalog();
  console.log("ai-platform-registry: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
