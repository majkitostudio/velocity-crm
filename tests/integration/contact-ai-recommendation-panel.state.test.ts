import assert from "node:assert/strict";

import {
  isContactAiRecommendationRefreshing,
  resolveContactAiRecommendationPanelPhase,
  shouldShowContactAiRecommendationGenerateButton,
  shouldShowContactAiRecommendationRefreshButton,
} from "../../src/features/ai/components/contact-ai-recommendation-panel.types";
import type { RecommendationViewModel } from "../../src/features/ai/types/recommendation-view-model";

const SAMPLE_VIEW_MODEL: RecommendationViewModel = {
  status: "ready",
  source: "LIVE",
  primaryAction: {
    actionType: "CALL",
    title: "Schedule a follow-up call with the contact",
    rationale: "Deterministic recommendation for integration test panel state.",
    priority: "MEDIUM",
    suggestedContactAt: "2024-01-06T09:00:00.000Z",
  },
  alternatives: [
    {
      actionType: "SCHEDULE_CALLBACK",
      title: "Plan a callback within two business days",
      rationale: "Use when immediate outreach is not required.",
      priority: "LOW",
    },
  ],
  risks: [],
  followUpTasks: ["Review open callbacks before the next outreach attempt."],
  confidence: 0.82,
  metadata: {
    generatedAt: "2024-01-01T00:00:00.000Z",
    promptLabel: "recommendation@v1",
    correlationId: "correlation-recommendation-panel-state",
  },
};

async function assertPanelPhases() {
  assert.equal(
    resolveContactAiRecommendationPanelPhase({
      viewModel: null,
      isPending: false,
      errorMessage: null,
    }),
    "empty",
  );

  assert.equal(
    resolveContactAiRecommendationPanelPhase({
      viewModel: null,
      isPending: true,
      errorMessage: null,
    }),
    "loading",
  );

  assert.equal(
    resolveContactAiRecommendationPanelPhase({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: false,
      errorMessage: null,
    }),
    "success",
  );

  assert.equal(
    resolveContactAiRecommendationPanelPhase({
      viewModel: null,
      isPending: false,
      errorMessage: "Nepodařilo se zpracovat odpověď AI. Zkuste to znovu.",
    }),
    "error",
  );

  assert.equal(
    resolveContactAiRecommendationPanelPhase({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: true,
      errorMessage: null,
    }),
    "success",
    "refresh keeps existing recommendation visible while pending",
  );
}

async function assertRefreshButtonVisibility() {
  assert.equal(
    shouldShowContactAiRecommendationRefreshButton({
      viewModel: SAMPLE_VIEW_MODEL,
      refreshEnabled: true,
    }),
    true,
  );

  assert.equal(
    shouldShowContactAiRecommendationRefreshButton({
      viewModel: SAMPLE_VIEW_MODEL,
      refreshEnabled: false,
    }),
    false,
  );

  assert.equal(
    shouldShowContactAiRecommendationRefreshButton({
      viewModel: null,
      refreshEnabled: true,
    }),
    false,
  );
}

async function assertGenerateButtonVisibility() {
  assert.equal(
    shouldShowContactAiRecommendationGenerateButton({
      viewModel: null,
      isPending: false,
    }),
    true,
  );

  assert.equal(
    shouldShowContactAiRecommendationGenerateButton({
      viewModel: null,
      isPending: true,
    }),
    false,
  );

  assert.equal(
    shouldShowContactAiRecommendationGenerateButton({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: false,
    }),
    false,
  );
}

async function assertRefreshPendingState() {
  assert.equal(
    isContactAiRecommendationRefreshing({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: true,
    }),
    true,
  );

  assert.equal(
    isContactAiRecommendationRefreshing({
      viewModel: null,
      isPending: true,
    }),
    false,
  );

  assert.equal(
    isContactAiRecommendationRefreshing({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: false,
    }),
    false,
  );
}

async function main() {
  await assertPanelPhases();
  await assertRefreshButtonVisibility();
  await assertGenerateButtonVisibility();
  await assertRefreshPendingState();
  console.log("contact-ai-recommendation-panel.state: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
