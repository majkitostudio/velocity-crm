import type { LlmTaskProfile } from "../llm/types/llm-model";
import type { PromptTemplateId } from "../prompts/types/prompt-template";

export function mapTaskProfileToPromptId(profile: LlmTaskProfile): PromptTemplateId {
  switch (profile) {
    case "SUMMARY":
      return "summary";
    case "RECOMMENDATION":
      return "recommendation";
    case "CALL_PREP":
      return "call-prep";
    case "COPILOT":
      return "copilot";
    case "GENERAL":
      return "general";
    default: {
      const _exhaustive: never = profile;
      return _exhaustive;
    }
  }
}
