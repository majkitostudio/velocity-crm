import type { CallOutcome } from "@/src/generated/prisma/client";

const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  ORDER: "Objednávka",
  FAIL: "Neúspěch",
  CALL_LATER: "Zavolat později",
  SCHEDULE_CALL: "Naplánovat callback",
};

export function getCallOutcomeLabel(outcome: CallOutcome): string {
  return CALL_OUTCOME_LABELS[outcome];
}
