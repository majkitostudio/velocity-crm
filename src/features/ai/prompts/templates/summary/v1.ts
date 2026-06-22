import type { PromptBuildInput, PromptBuildResult, PromptTemplate } from "../../types/prompt-template";
import { serializeContactAiContextForPrompt } from "../../lib/serialize-contact-ai-context";

const SYSTEM_PROMPT_CS =
  "Jsi asistent pro operátory call centra. Odpovídej stručně a věcně v češtině.";

export const summaryPromptTemplateV1: PromptTemplate = {
  id: "summary",
  version: 1,

  build(input: PromptBuildInput): PromptBuildResult {
    const locale = input.locale ?? "cs";
    const contextJson = serializeContactAiContextForPrompt(input.context, {
      ...input.contextView,
      includeSensitiveData: input.redaction?.includeSensitiveData,
    });

    const supplements = [
      input.supplements?.operatorInstructions,
      input.supplements?.campaignContext,
      input.supplements?.communicationSnippet,
    ]
      .filter(Boolean)
      .join("\n");

    const userContent = [
      "Shrň kontakt pro operátora na základě následujícího JSON kontextu.",
      supplements ? `Doplňující instrukce:\n${supplements}` : null,
      "```json",
      contextJson,
      "```",
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n\n");

    return {
      messages: [
        {
          role: "system",
          content: locale === "cs" ? SYSTEM_PROMPT_CS : SYSTEM_PROMPT_CS,
        },
        { role: "user", content: userContent },
      ],
      promptId: "summary",
      promptVersion: 1,
      summary: "summary@v1",
    };
  },
};
