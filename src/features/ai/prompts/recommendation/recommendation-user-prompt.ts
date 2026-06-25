import type { PromptBuildInput } from "../types/prompt-template";
import { serializeContactAiContext } from "../serializers/serialize-contact-ai-context";

const USER_PROMPT_INTRO_CS =
  "Doporuč další akci operátora na základě následujícího JSON kontextu.";

const USER_PROMPT_INTRO_EN =
  "Recommend the operator's next action based on the following JSON context.";

function buildSupplementsBlock(input: PromptBuildInput): string | null {
  const parts = [
    input.supplements?.operatorInstructions,
    input.supplements?.campaignContext,
    input.supplements?.communicationSnippet,
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return null;
  }

  return parts.join("\n");
}

export function buildRecommendationUserPrompt(input: PromptBuildInput): string {
  const locale = input.locale ?? "cs";
  const contextJson = serializeContactAiContext(input.context, {
    ...input.contextView,
    includeSensitiveData: input.redaction?.includeSensitiveData,
  });

  const intro = locale === "en" ? USER_PROMPT_INTRO_EN : USER_PROMPT_INTRO_CS;
  const supplements = buildSupplementsBlock(input);

  return [
    intro,
    supplements
      ? locale === "en"
        ? `Additional instructions:\n${supplements}`
        : `Doplňující instrukce:\n${supplements}`
      : null,
    "```json",
    contextJson,
    "```",
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
}
