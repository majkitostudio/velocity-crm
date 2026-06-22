import { readFileSync } from "node:fs";
import { join } from "node:path";

import { toContactAiContext } from "@/src/features/ai/context/mappers/to-contact-ai-context";
import type { ContactAiContext } from "@/src/features/ai/context/types/contact-ai-context";
import type { ContactContext } from "@/src/features/contacts/context/types/contact-context";

const GOLDEN_FIXTURE_PATH = join(
  import.meta.dirname,
  "../../../../../tests/integration/fixtures/prompt-summary-v1-golden.json",
);

function hydrateGoldenContactContext(raw: ContactContext): ContactContext {
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

export function loadSummaryPromptGoldenContactContext(): ContactContext {
  const raw = JSON.parse(readFileSync(GOLDEN_FIXTURE_PATH, "utf8")) as ContactContext;
  return hydrateGoldenContactContext(raw);
}

export function loadSummaryPromptGoldenAiContext(): ContactAiContext {
  return toContactAiContext(loadSummaryPromptGoldenContactContext());
}

export const summaryPromptGoldenBuildInput = {
  get context() {
    return loadSummaryPromptGoldenAiContext();
  },
  taskProfile: "SUMMARY" as const,
  locale: "cs" as const,
  redaction: { includeSensitiveData: true as const },
};
