import type { AiServiceDescriptor } from "./ai-service-descriptor";
import type { AiServiceId } from "./ai-service-id";

const RAW_DESCRIPTORS: Record<AiServiceId, AiServiceDescriptor> = {
  "contact-summary": {
    id: "contact-summary",
    displayName: "AI shrnutí kontaktu",
    description: "Stručné shrnutí kontaktu pro operátora",
    taskProfile: "SUMMARY",
    taskCategory: "SUMMARY",
    taskType: "CUSTOMER_SUMMARY",
    defaultPromptVersion: 1,
    featureFlag: "ai.contact_summary",
    minRole: "OPERATOR",
    modelRequirements: {
      structuredOutput: true,
      jsonSchema: true,
      streaming: false,
      toolCalling: false,
      vision: false,
    },
    supportsCaching: true,
    supportsStreaming: false,
    supportsAsync: false,
    sanitizerProfile: "SUMMARY",
  },
  recommendation: {
    id: "recommendation",
    displayName: "AI doporučení",
    description: "Doporučení dalších kroků pro operátora",
    taskProfile: "RECOMMENDATION",
    taskCategory: "RECOMMENDATION",
    taskType: "CUSTOMER_SUMMARY",
    defaultPromptVersion: 1,
    featureFlag: "ai.recommendation",
    minRole: "OPERATOR",
    modelRequirements: {
      structuredOutput: true,
      jsonSchema: true,
      streaming: false,
      toolCalling: false,
      vision: false,
    },
    supportsCaching: true,
    supportsStreaming: false,
    supportsAsync: false,
    sanitizerProfile: "RECOMMENDATION",
  },
  "call-prep": {
    id: "call-prep",
    displayName: "Příprava hovoru",
    description: "Kontext pro nadcházející hovor",
    taskProfile: "CALL_PREP",
    taskCategory: "CALL_PREPARATION",
    taskType: "NEXT_ACTION",
    defaultPromptVersion: 1,
    featureFlag: "ai.recommendation",
    minRole: "OPERATOR",
    modelRequirements: {
      structuredOutput: false,
      jsonSchema: false,
      streaming: false,
      toolCalling: false,
      vision: false,
    },
    supportsCaching: true,
    supportsStreaming: false,
    supportsAsync: false,
    sanitizerProfile: "CALL_PREPARATION",
  },
  "email-draft": {
    id: "email-draft",
    displayName: "Návrh e-mailu",
    taskProfile: "GENERAL",
    taskCategory: "EMAIL_DRAFT",
    taskType: "CUSTOMER_SUMMARY",
    defaultPromptVersion: 1,
    featureFlag: "ai.recommendation",
    minRole: "OPERATOR",
    modelRequirements: {
      structuredOutput: true,
      jsonSchema: false,
      streaming: false,
      toolCalling: false,
      vision: false,
    },
    supportsCaching: false,
    supportsStreaming: false,
    supportsAsync: false,
    sanitizerProfile: "EMAIL_DRAFT",
  },
  "sms-draft": {
    id: "sms-draft",
    displayName: "Návrh SMS",
    taskProfile: "GENERAL",
    taskCategory: "SMS_DRAFT",
    taskType: "CUSTOMER_SUMMARY",
    defaultPromptVersion: 1,
    featureFlag: "ai.recommendation",
    minRole: "OPERATOR",
    modelRequirements: {
      structuredOutput: true,
      jsonSchema: false,
      streaming: false,
      toolCalling: false,
      vision: false,
    },
    supportsCaching: false,
    supportsStreaming: false,
    supportsAsync: false,
    sanitizerProfile: "SMS_DRAFT",
  },
  copilot: {
    id: "copilot",
    displayName: "Sales Copilot",
    description: "Interaktivní asistent pro operátora",
    taskProfile: "COPILOT",
    taskCategory: "COPILOT",
    taskType: "CUSTOMER_SUMMARY",
    defaultPromptVersion: 1,
    featureFlag: "ai.copilot",
    minRole: "OPERATOR",
    modelRequirements: {
      structuredOutput: false,
      jsonSchema: false,
      streaming: true,
      toolCalling: true,
      vision: false,
    },
    supportsCaching: false,
    supportsStreaming: true,
    supportsAsync: false,
    sanitizerProfile: "RECOMMENDATION",
  },
};

function freezeDescriptors(
  descriptors: Record<AiServiceId, AiServiceDescriptor>,
): Readonly<Record<AiServiceId, AiServiceDescriptor>> {
  const frozenEntries = Object.entries(descriptors).map(([id, descriptor]) => {
    return [id, Object.freeze({ ...descriptor })];
  });

  return Object.freeze(
    Object.fromEntries(frozenEntries) as Record<AiServiceId, AiServiceDescriptor>,
  );
}

export const AI_SERVICE_DESCRIPTORS = freezeDescriptors(RAW_DESCRIPTORS);

export function getAiServiceDescriptor(id: AiServiceId): AiServiceDescriptor {
  const descriptor = AI_SERVICE_DESCRIPTORS[id];
  if (!descriptor) {
    throw new Error(`AI service descriptor not found: ${id}`);
  }
  return descriptor;
}

export function listAiServiceDescriptors(): readonly AiServiceDescriptor[] {
  return Object.freeze(Object.values(AI_SERVICE_DESCRIPTORS));
}
