import type { ContactAiContext } from "@/src/features/ai/context/types/contact-ai-context";

import type { PromptBuildInput } from "../types/prompt-template";

export function serializeContactAiContextForPrompt(
  context: ContactAiContext,
  options?: PromptBuildInput["contextView"] & { includeSensitiveData?: boolean },
): string {
  const includeSensitive = options?.includeSensitiveData !== false;
  const maxHistory = options?.maxHistoryItems;

  const historyActivities =
    maxHistory !== undefined
      ? context.history.activities.slice(0, maxHistory)
      : context.history.activities;

  const payload = {
    contact: {
      ...context.contact,
      phone: includeSensitive ? context.contact.phone : null,
      email: includeSensitive ? context.contact.email : null,
    },
    snapshot: {
      ...context.snapshot,
      notes: {
        recent: context.snapshot.notes.recent.map((note) => ({
          ...note,
          body:
            includeSensitive && options?.includeNoteBodies !== false
              ? note.body
              : "[redacted]",
        })),
      },
    },
    history: { activities: historyActivities },
    statistics: context.statistics,
  };

  return JSON.stringify(payload, null, 2);
}
