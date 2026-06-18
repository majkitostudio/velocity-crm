"use client";

import { useCallback, useState } from "react";

import type { CallWorkflowOutcome, CallWorkflowPhase } from "../types";

export function useCallWorkflowState() {
  const [phase, setPhase] = useState<CallWorkflowPhase>("idle");
  const [selectedOutcome, setSelectedOutcome] = useState<CallWorkflowOutcome | null>(
    null,
  );
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const startCall = useCallback(() => {
    setPhase("active");
    setSelectedOutcome(null);
  }, []);

  const endCall = useCallback(() => {
    setPhase("disposition");
    setSelectedOutcome(null);
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  const selectOutcome = useCallback((outcome: CallWorkflowOutcome) => {
    setSelectedOutcome(outcome);
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setSelectedOutcome(null);
    setIdempotencyKey(null);
  }, []);

  return {
    phase,
    selectedOutcome,
    idempotencyKey,
    startCall,
    endCall,
    selectOutcome,
    reset,
  };
}
