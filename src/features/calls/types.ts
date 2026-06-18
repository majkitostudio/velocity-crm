import type { CallOutcome, ContactStatus } from "@/src/generated/prisma/client";

import { CallOutcomeValue } from "./constants";

export type CompleteCallResult = {
  callActivityId: string;
  outcome: CallOutcome;
  contactStatus: ContactStatus;
  callbackId?: string;
  failCount: number;
  contactBecameLost: boolean;
};

export type CallWorkflowPhase = "idle" | "active" | "disposition";

export type CallWorkflowOutcome = (typeof CallOutcomeValue)[
  "CALL_LATER" | "SCHEDULE_CALL" | "FAIL"
];
