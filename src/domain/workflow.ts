/** Default delay for CALL_LATER outcome (hours). See ADR-002, WORKFLOW_RULES.md */
export const CALL_LATER_DELAY_HOURS = 4;

/** FAIL count threshold before Contact → LOST. See ADR-003, WORKFLOW_RULES.md */
export const FAIL_THRESHOLD = 3;

export function callLaterScheduledAt(from = new Date()): Date {
  const scheduled = new Date(from);
  scheduled.setHours(scheduled.getHours() + CALL_LATER_DELAY_HOURS);
  return scheduled;
}
