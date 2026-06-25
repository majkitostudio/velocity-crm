export const AI_TASK_CATEGORIES = [
  "SUMMARY",
  "RECOMMENDATION",
  "CALL_PREPARATION",
  "EMAIL_DRAFT",
  "SMS_DRAFT",
  "COPILOT",
] as const;

export type AiTaskCategory = (typeof AI_TASK_CATEGORIES)[number];
