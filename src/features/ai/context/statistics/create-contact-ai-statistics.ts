import type { ContactContextProviderOutputs } from "../types/contact-context-provider";
import type { ContactAiStatistics } from "../types/contact-ai-context";

export function createContactAiStatistics(
  outputs: ContactContextProviderOutputs,
): ContactAiStatistics {
  return {
    totalCalls: outputs.activity?.aggregates.callFinishedCount ?? 0,
    totalOrders: outputs.orders?.aggregates.totalOrderCount ?? 0,
    totalOpenCallbacks: outputs.callbacks?.aggregates.openCount ?? 0,
    totalNotes: outputs.notes?.aggregates.totalNoteCount ?? 0,
    failCount: outputs.contact?.aggregates.failCount ?? 0,
    successfulOrderCount: outputs.orders?.aggregates.successfulOrderCount ?? 0,
  };
}
