import type { PromptRenderInput, PromptRenderResult } from "./prompt-template.types";

export function renderPromptTemplate(input: PromptRenderInput): PromptRenderResult {
  let content = input.template;

  for (const [key, value] of Object.entries(input.variables)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }

  return { content };
}
