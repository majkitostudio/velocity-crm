import type { AiResultSource } from "../types/recommendation-view-model";

type ContactAiRecommendationSourceBadgeProps = {
  source: AiResultSource;
};

const SOURCE_LABELS: Record<AiResultSource, string> = {
  LIVE: "LIVE",
  CACHE: "CACHE",
};

export function ContactAiRecommendationSourceBadge({
  source,
}: ContactAiRecommendationSourceBadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700"
      data-testid="contact-ai-recommendation-source-badge"
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}
