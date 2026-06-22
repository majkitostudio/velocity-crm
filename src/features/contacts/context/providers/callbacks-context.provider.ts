import {
  listOpenCallbacksForContact,
  listRecentClosedCallbacksForContact,
} from "@/src/features/callbacks/server/callbacks.repository";

import type { ContactContextProvider } from "../types/contact-context-provider";

export const CALLBACKS_CONTEXT_PROVIDER_VERSION = 1;

export const callbacksContextProvider: ContactContextProvider<"callbacks"> = {
  key: "callbacks",
  version: CALLBACKS_CONTEXT_PROVIDER_VERSION,

  async provide(input, options) {
    const [open, recentClosed] = await Promise.all([
      listOpenCallbacksForContact({
        companyId: input.companyId,
        contactId: input.contactId,
      }),
      listRecentClosedCallbacksForContact({
        companyId: input.companyId,
        contactId: input.contactId,
        limit: options.limits.recentClosedCallbacks,
      }),
    ]);

    const mapCallback = (callback: (typeof open)[number]) => ({
      id: callback.id,
      scheduledAt: callback.scheduledAt,
      status: callback.status,
      note: options.includeSensitiveData ? callback.note : null,
      assigneeName: callback.assignedUser.name,
    });

    return {
      callbacks: {
        open: open.map(mapCallback),
        recentClosed: recentClosed.map(mapCallback),
      },
      aggregates: {
        openCount: open.length,
      },
    };
  },
};
