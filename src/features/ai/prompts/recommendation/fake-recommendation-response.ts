import type { ContactRecommendation } from "./recommendation-output-schema";

export function buildFakeRecommendationResponse(contactId: string): ContactRecommendation {
  const elevatedFailContext = contactId.includes("high-fail");

  return {
    primaryAction: {
      actionType: elevatedFailContext ? "ESCALATE" : "CALL",
      title: elevatedFailContext
        ? "Escalate contact to manager review"
        : "Schedule a follow-up call with the contact",
      rationale: `Deterministic recommendation for contact ${contactId}. Review workflow context and choose the next operator action using only the provided CRM data.`,
      priority: elevatedFailContext ? "HIGH" : "MEDIUM",
      suggestedContactAt: "2024-01-06T09:00:00.000Z",
    },
    alternatives: [
      {
        actionType: "SCHEDULE_CALLBACK",
        title: "Plan a callback within two business days",
        rationale:
          "Use when immediate outreach is not required but follow-up timing still matters.",
        priority: "LOW",
      },
    ],
    risks: elevatedFailContext
      ? ["Workflow fail count is elevated in the provided context."]
      : [],
    followUpTasks: ["Review open callbacks before the next outreach attempt."],
    confidence: 0.82,
  };
}
