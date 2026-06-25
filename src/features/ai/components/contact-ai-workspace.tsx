"use client";

import { ContactAiRecommendationPanel } from "./contact-ai-recommendation-panel";
import { ContactAiSummaryPanel } from "./contact-ai-summary-panel";

type ContactAiWorkspaceProps = {
  contactId: string;
  summaryEnabled: boolean;
  summaryRefreshEnabled: boolean;
  recommendationEnabled: boolean;
  recommendationRefreshEnabled: boolean;
};

export function ContactAiWorkspace({
  contactId,
  summaryEnabled,
  summaryRefreshEnabled,
  recommendationEnabled,
  recommendationRefreshEnabled,
}: ContactAiWorkspaceProps) {
  return (
    <div className="space-y-4" data-testid="contact-ai-workspace">
      {summaryEnabled ? (
        <ContactAiSummaryPanel
          contactId={contactId}
          refreshEnabled={summaryRefreshEnabled}
        />
      ) : null}
      {recommendationEnabled ? (
        <ContactAiRecommendationPanel
          contactId={contactId}
          refreshEnabled={recommendationRefreshEnabled}
        />
      ) : null}
    </div>
  );
}
