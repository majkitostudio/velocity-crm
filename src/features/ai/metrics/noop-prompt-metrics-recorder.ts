import type { PromptMetricsRecorder } from "./prompt-metrics-recorder";

export const noopPromptMetricsRecorder: PromptMetricsRecorder = {
  async record() {
    // Slice 12.1 — no-op sink
  },
};
