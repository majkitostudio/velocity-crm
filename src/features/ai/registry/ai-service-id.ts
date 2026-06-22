export const AI_SERVICE_IDS = [
  "contact-summary",
  "recommendation",
  "call-prep",
  "email-draft",
  "sms-draft",
  "copilot",
] as const;

export type AiServiceId = (typeof AI_SERVICE_IDS)[number];
