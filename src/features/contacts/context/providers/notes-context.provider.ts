import {
  countNotesForContact,
  listNotesForContact,
} from "@/src/features/contacts/server/notes.read.repository";

import type { ContactContextProvider } from "../types/contact-context-provider";

export const NOTES_CONTEXT_PROVIDER_VERSION = 1;

export const notesContextProvider: ContactContextProvider<"notes"> = {
  key: "notes",
  version: NOTES_CONTEXT_PROVIDER_VERSION,

  async provide(input, options) {
    const [notes, totalNoteCount] = await Promise.all([
      listNotesForContact({
        companyId: input.companyId,
        contactId: input.contactId,
        limit: options.limits.notes ?? undefined,
      }),
      countNotesForContact({
        companyId: input.companyId,
        contactId: input.contactId,
      }),
    ]);

    return {
      notes: {
        recent: notes.map((note) => ({
          id: note.id,
          body: options.includeSensitiveData ? note.body : "[redacted]",
          authorName: note.author.name,
          createdAt: note.createdAt,
        })),
      },
      aggregates: {
        totalNoteCount,
      },
    };
  },
};
