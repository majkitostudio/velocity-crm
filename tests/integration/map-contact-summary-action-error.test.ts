import assert from "node:assert/strict";

import {
  ForbiddenError,
  NotFoundError,
} from "../../src/domain/errors";
import {
  AiCapabilityError,
  AiFeatureDisabledError,
} from "../../src/features/ai/services/shared/ai-platform-errors";
import {
  LlmInvalidResponseError,
  LlmProviderNotConfiguredError,
  LlmProviderUnavailableError,
  LlmSchemaValidationError,
  LlmTimeoutError,
} from "../../src/features/ai/llm/errors/llm-errors";
import { mapContactSummaryActionError } from "../../src/features/ai/lib/map-contact-summary-action-error";

async function assertDomainErrors() {
  assert.equal(
    mapContactSummaryActionError(new ForbiddenError("x")),
    "Nemáte oprávnění k tomuto kontaktu.",
  );
  assert.equal(
    mapContactSummaryActionError(new NotFoundError("x")),
    "Kontakt nebyl nalezen.",
  );
  assert.equal(
    mapContactSummaryActionError(new AiFeatureDisabledError("x")),
    "AI shrnutí není dostupné.",
  );
  assert.equal(
    mapContactSummaryActionError(new AiCapabilityError("x")),
    "AI funkce není podporována aktuálním modelem.",
  );
}

async function assertLlmErrors() {
  assert.equal(
    mapContactSummaryActionError(new LlmInvalidResponseError("x", "fake")),
    "Nepodařilo se zpracovat odpověď AI. Zkuste to znovu.",
  );
  assert.equal(
    mapContactSummaryActionError(new LlmSchemaValidationError("x", "fake")),
    "Nepodařilo se zpracovat odpověď AI. Zkuste to znovu.",
  );
  assert.equal(
    mapContactSummaryActionError(new LlmProviderNotConfiguredError("openai")),
    "AI služba je dočasně nedostupná.",
  );
  assert.equal(
    mapContactSummaryActionError(new LlmProviderUnavailableError("x", "openai")),
    "AI služba je dočasně nedostupná.",
  );
  assert.equal(
    mapContactSummaryActionError(new LlmTimeoutError("x", "fake")),
    "Generování shrnutí selhalo. Zkuste to znovu.",
  );
}

async function assertUnknownError() {
  assert.equal(
    mapContactSummaryActionError(new Error("boom")),
    "Neočekávaná chyba. Zkuste to znovu.",
  );
}

async function main() {
  await assertDomainErrors();
  await assertLlmErrors();
  await assertUnknownError();
  console.log("map-contact-summary-action-error: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
