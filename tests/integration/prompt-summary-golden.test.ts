import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { toContactAiContext } from "../../src/features/ai/context/mappers/to-contact-ai-context";
import { buildPrompt } from "../../src/features/ai/prompts/registry";
import type { ContactContext } from "../../src/features/contacts/context/types/contact-context";

const GOLDEN_PATH = join(
  import.meta.dirname,
  "fixtures",
  "prompt-summary-v1-golden.json",
);

function loadGoldenContactContext(): ContactContext {
  const raw = JSON.parse(readFileSync(GOLDEN_PATH, "utf8")) as ContactContext;
  return {
    ...raw,
    contact: {
      ...raw.contact,
      createdAt: new Date(raw.contact.createdAt as unknown as string),
      updatedAt: new Date(raw.contact.updatedAt as unknown as string),
    },
    snapshot: {
      ...raw.snapshot,
      workflow: {
        ...raw.snapshot.workflow,
        lastCall: raw.snapshot.workflow.lastCall
          ? {
              ...raw.snapshot.workflow.lastCall,
              createdAt: new Date(
                raw.snapshot.workflow.lastCall.createdAt as unknown as string,
              ),
            }
          : null,
      },
      callbacks: {
        open: raw.snapshot.callbacks.open.map((callback) => ({
          ...callback,
          scheduledAt: new Date(callback.scheduledAt as unknown as string),
        })),
        recentClosed: raw.snapshot.callbacks.recentClosed.map((callback) => ({
          ...callback,
          scheduledAt: new Date(callback.scheduledAt as unknown as string),
        })),
      },
      notes: {
        recent: raw.snapshot.notes.recent.map((note) => ({
          ...note,
          createdAt: new Date(note.createdAt as unknown as string),
        })),
      },
      orders: { recent: [] },
      products: { catalog: [], purchased: [], lastPurchased: null },
    },
    history: { activities: [] },
    statistics: raw.statistics,
  };
}

async function assertSummaryPromptGolden() {
  const context = toContactAiContext(loadGoldenContactContext());

  const result = buildPrompt({
    context,
    taskProfile: "SUMMARY",
    locale: "cs",
    redaction: { includeSensitiveData: true },
  });

  assert.equal(result.promptId, "summary");
  assert.equal(result.promptVersion, 1);
  assert.equal(result.summary, "summary@v1");
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0]?.role, "system");
  assert.equal(result.messages[1]?.role, "user");
  assert.match(result.messages[1]?.content ?? "", /Golden Contact/);
  assert.match(result.messages[1]?.content ?? "", /```json/);
}

async function assertDeterministicPromptBuild() {
  const context = toContactAiContext(loadGoldenContactContext());
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
