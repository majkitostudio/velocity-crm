export const SANITIZER_PROFILES = [
  "SUMMARY",
  "RECOMMENDATION",
  "CALL_PREPARATION",
  "EMAIL_DRAFT",
  "SMS_DRAFT",
] as const;

export type SanitizerProfile = (typeof SANITIZER_PROFILES)[number];
