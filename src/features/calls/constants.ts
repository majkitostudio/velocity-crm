export const CallOutcomeValue = {
  ORDER: "ORDER",
  CALL_LATER: "CALL_LATER",
  SCHEDULE_CALL: "SCHEDULE_CALL",
  FAIL: "FAIL",
} as const;

export type CallOutcomeValue = (typeof CallOutcomeValue)[keyof typeof CallOutcomeValue];
