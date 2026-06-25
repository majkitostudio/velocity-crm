import assert from "node:assert/strict";

import {
  formatContactAiSummarySourceLabel,
  isContactAiSummaryRefreshing,
  resolveContactAiSummaryPanelPhase,
  shouldShowContactAiSummaryRefreshButton,
} from "../../src/features/ai/components/contact-ai-summary-panel.types";
import type { SummaryViewModel } from "../../src/features/ai/types/summary-view-model";

const SAMPLE_VIEW_MODEL: SummaryViewModel = {
  status: "ready",
  source: "LIVE",
  summary: "Deterministic summary for integration test panel state.",
  recommendations: ["Call back tomorrow."],
  warnings: [],
  confidence: 0.8,
  metadata: {
    generatedAt: "2024-01-01T00:00:00.000Z",
    promptLabel: "summary@v1",
    correlationId: "correlation-panel-state",
  },
};

async function assertPanelPhases() {
  assert.equal(
    resolveContactAiSummaryPanelPhase({
      viewModel: null,
      isPending: false,
      errorMessage: null,
    }),
    "empty",
  );

  assert.equal(
    resolveContactAiSummaryPanelPhase({
      viewModel: null,
      isPending: true,
      errorMessage: null,
    }),
    "loading",
  );

  assert.equal(
    resolveContactAiSummaryPanelPhase({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: false,
      errorMessage: null,
    }),
    "success",
  );

  assert.equal(
    resolveContactAiSummaryPanelPhase({
      viewModel: null,
      isPending: false,
      errorMessage: "Nepodařilo se zpracovat odpověď AI. Zkuste to znovu.",
    }),
    "error",
  );

  assert.equal(
    resolveContactAiSummaryPanelPhase({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: true,
      errorMessage: null,
    }),
    "success",
    "refresh keeps existing summary visible while pending",
  );
}

async function assertRefreshButtonVisibility() {
  assert.equal(
    shouldShowContactAiSummaryRefreshButton({
      viewModel: SAMPLE_VIEW_MODEL,
      refreshEnabled: true,
    }),
    true,
  );

  assert.equal(
    shouldShowContactAiSummaryRefreshButton({
      viewModel: SAMPLE_VIEW_MODEL,
      refreshEnabled: false,
    }),
    false,
  );

  assert.equal(
    shouldShowContactAiSummaryRefreshButton({
      viewModel: null,
      refreshEnabled: true,
    }),
    false,
  );
}

async function assertRefreshPendingState() {
  assert.equal(
    isContactAiSummaryRefreshing({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: true,
    }),
    true,
  );

  assert.equal(
    isContactAiSummaryRefreshing({
      viewModel: null,
      isPending: true,
    }),
    false,
  );

  assert.equal(
    isContactAiSummaryRefreshing({
      viewModel: SAMPLE_VIEW_MODEL,
      isPending: false,
    }),
    false,
  );
}

async function assertSourceBadgeLabels() {
  assert.equal(formatContactAiSummarySourceLabel("LIVE"), "LIVE");
  assert.equal(formatContactAiSummarySourceLabel("CACHE"), "CACHE");
}

async function main() {
  await assertPanelPhases();
  await assertRefreshButtonVisibility();
  await assertRefreshPendingState();
  await assertSourceBadgeLabels();
  console.log("contact-ai-summary-panel.state: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
