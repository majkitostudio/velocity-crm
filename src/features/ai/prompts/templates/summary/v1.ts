import type { PromptTemplate } from "../../types/prompt-template";
import { buildSummaryPrompt } from "../../summary/summary-prompt.builder";
import { SUMMARY_PROMPT_ID, SUMMARY_PROMPT_VERSION } from "../../summary/summary-prompt-version";

export const summaryPromptTemplateV1: PromptTemplate = {
  id: SUMMARY_PROMPT_ID,
  version: SUMMARY_PROMPT_VERSION,
  build: buildSummaryPrompt,
};
