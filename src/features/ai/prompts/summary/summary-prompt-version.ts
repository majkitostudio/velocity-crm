import type { PromptTemplateId } from "../types/prompt-template";

export const SUMMARY_PROMPT_ID: PromptTemplateId = "summary";
export const SUMMARY_PROMPT_VERSION = 1;

export function formatSummaryPromptLabel(version: number = SUMMARY_PROMPT_VERSION): string {
  return `${SUMMARY_PROMPT_ID}@v${version}`;
}

export const SUMMARY_PROMPT_LABEL = formatSummaryPromptLabel(SUMMARY_PROMPT_VERSION);
