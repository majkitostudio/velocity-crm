import type { PromptBuildInput, PromptTemplate } from "../../types/prompt-template";
import { serializeContactAiContextForPrompt } from "../../lib/serialize-contact-ai-context";

const SYSTEM_PROMPT =
  "You are a helpful CRM assistant. Respond concisely based on the provided contact context.";

function createStubTemplate(
  id: PromptTemplate["id"],
  version: number,
  instruction: string,
): PromptTemplate {
  return {
    id,
    version,
    build(input: PromptBuildInput) {
      const contextJson = serializeContactAiContextForPrompt(input.context, {
        ...input.contextView,
        includeSensitiveData: input.redaction?.includeSensitiveData,
      });

      return {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${instruction}\n\n\`\`\`json\n${contextJson}\n\`\`\``,
          },
        ],
        promptId: id,
        promptVersion: version,
        summary: `${id}@v${version}`,
      };
    },
  };
}

export const generalPromptTemplateV1 = createStubTemplate(
  "general",
  1,
  "Assist the operator using the contact context below.",
);

export const callPrepPromptTemplateV1 = createStubTemplate(
  "call-prep",
  1,
  "Prepare the operator for the next call.",
);

export const copilotPromptTemplateV1 = createStubTemplate(
  "copilot",
  1,
  "Provide sales copilot guidance for this contact.",
);
