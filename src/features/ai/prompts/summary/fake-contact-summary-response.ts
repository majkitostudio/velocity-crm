import type { ContactSummary } from "./summary-output-schema";

export function buildFakeContactSummaryResponse(contactId: string): ContactSummary {
  const elevatedFailContext = contactId.includes("high-fail");

  return {
    summary: `Deterministic AI summary for contact ${contactId}. Review workflow context and plan the next operator action using only the provided CRM data.`,
    recommendations: [
      "Schedule a follow-up call within two business days.",
      "Review open callbacks before the next outreach attempt.",
    ],
    warnings: elevatedFailContext
      ? ["Workflow fail count is elevated in the provided context."]
      : [],
    confidence: 0.85,
  };
}
