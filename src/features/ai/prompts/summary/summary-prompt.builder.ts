import type { PromptBuildInput, PromptBuildResult } from "../types/prompt-template";
import { buildSummarySystemPrompt } from "./summary-system-prompt";
import { buildSummaryUserPrompt } from "./summary-user-prompt";
import {
  formatSummaryPromptLabel,
  SUMMARY_PROMPT_ID,
  SUMMARY_PROMPT_VERSION,
} from "./summary-prompt-version";

export function buildSummaryPrompt(input: PromptBuildInput): PromptBuildResult {
  const locale = input.locale ?? "cs";

  return {
    messages: [
      { role: "system", content: buildSummarySystemPrompt(locale) },
      { role: "user", content: buildSummaryUserPrompt(input) },
    ],
    promptId: SUMMARY_PROMPT_ID,
    promptVersion: SUMMARY_PROMPT_VERSION,
    summary: formatSummaryPromptLabel(SUMMARY_PROMPT_VERSION),
  };
}
