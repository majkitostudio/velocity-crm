import type { RecommendationViewModel } from "../types/recommendation-view-model";

export type ContactAiRecommendationPanelPhase = "empty" | "loading" | "success" | "error";

export type ResolveContactAiRecommendationPanelPhaseInput = {
  viewModel: RecommendationViewModel | null;
  isPending: boolean;
  errorMessage: string | null;
};

export function resolveContactAiRecommendationPanelPhase(
  input: ResolveContactAiRecommendationPanelPhaseInput,
): ContactAiRecommendationPanelPhase {
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

export function isContactAiRecommendationRefreshing(input: {
  viewModel: RecommendationViewModel | null;
  isPending: boolean;
}): boolean {
  return input.isPending && Boolean(input.viewModel);
}

export function shouldShowContactAiRecommendationRefreshButton(input: {
  viewModel: RecommendationViewModel | null;
  refreshEnabled: boolean;
}): boolean {
  return Boolean(input.viewModel) && input.refreshEnabled;
}

export function shouldShowContactAiRecommendationGenerateButton(input: {
  viewModel: RecommendationViewModel | null;
  isPending: boolean;
}): boolean {
  return !input.viewModel && !input.isPending;
}
