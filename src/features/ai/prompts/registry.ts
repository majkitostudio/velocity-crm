import { summaryPromptTemplateV1 } from "./templates/summary/v1";
import {
  callPrepPromptTemplateV1,
  copilotPromptTemplateV1,
  generalPromptTemplateV1,
  recommendationPromptTemplateV1,
} from "./templates/general/v1";
import type { PromptTemplate, PromptTemplateId } from "./types/prompt-template";

const promptTemplateRegistry = new Map<string, PromptTemplate>();

function registryKey(id: PromptTemplateId, version: number): string {
  return `${id}@v${version}`;
}

function registerTemplate(template: PromptTemplate): void {
  promptTemplateRegistry.set(registryKey(template.id, template.version), template);
}

registerTemplate(summaryPromptTemplateV1);
registerTemplate(generalPromptTemplateV1);
registerTemplate(recommendationPromptTemplateV1);
registerTemplate(callPrepPromptTemplateV1);
registerTemplate(copilotPromptTemplateV1);

const latestVersions: Record<PromptTemplateId, number> = {
  summary: 1,
  recommendation: 1,
  "call-prep": 1,
  copilot: 1,
  general: 1,
};

export function resolvePromptTemplate(
  id: PromptTemplateId,
  version?: number,
): PromptTemplate {
  const resolvedVersion = version ?? latestVersions[id];

  if (!resolvedVersion) {
    throw new Error(`Prompt template "${id}" is not registered`);
  }

  const template = promptTemplateRegistry.get(registryKey(id, resolvedVersion));

  if (!template) {
    throw new Error(`Prompt template "${id}" version ${resolvedVersion} not found`);
  }

  return template;
}

export function buildPrompt(input: Parameters<PromptTemplate["build"]>[0]): ReturnType<PromptTemplate["build"]> {
  const templateId = mapTaskProfileToTemplateId(input.taskProfile);
  const template = resolvePromptTemplate(templateId);
  return template.build(input);
}

function mapTaskProfileToTemplateId(
  profile: import("@/src/features/ai/llm/types/llm-model").LlmTaskProfile,
): PromptTemplateId {
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
