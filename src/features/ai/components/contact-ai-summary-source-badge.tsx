import type { AiResultSource } from "../types/summary-view-model";

type ContactAiSummarySourceBadgeProps = {
  source: AiResultSource;
};

const SOURCE_LABELS: Record<AiResultSource, string> = {
  LIVE: "LIVE",
  CACHE: "CACHE",
};

export function ContactAiSummarySourceBadge({ source }: ContactAiSummarySourceBadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-700"
      data-testid="contact-ai-summary-source-badge"
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}
