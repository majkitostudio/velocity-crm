import type { SummaryViewModel } from "../types/summary-view-model";

export type ContactAiSummaryPanelPhase = "empty" | "loading" | "success" | "error";

export type ResolveContactAiSummaryPanelPhaseInput = {
  viewModel: SummaryViewModel | null;
  isPending: boolean;
  errorMessage: string | null;
};

export function resolveContactAiSummaryPanelPhase(
  input: ResolveContactAiSummaryPanelPhaseInput,
): ContactAiSummaryPanelPhase {
  if (input.isPending && !input.viewModel) {
    return "loading";
  }

  if (input.errorMessage) {
    return "error";
  }

  if (input.viewModel) {
    return "success";
  }

  return "empty";
}

export function isContactAiSummaryRefreshing(input: {
  viewModel: SummaryViewModel | null;
  isPending: boolean;
}): boolean {
  return input.isPending && Boolean(input.viewModel);
}

export function shouldShowContactAiSummaryRefreshButton(input: {
  viewModel: SummaryViewModel | null;
  refreshEnabled: boolean;
}): boolean {
  return Boolean(input.viewModel) && input.refreshEnabled;
}

export function formatContactAiSummarySourceLabel(
  source: SummaryViewModel["source"],
): string {
  return source;
}
