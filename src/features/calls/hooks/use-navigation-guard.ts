"use client";

import { useEffect } from "react";

import type { CallWorkflowPhase } from "../types";

export function useNavigationGuard(phase: CallWorkflowPhase) {
  useEffect(() => {
    if (phase === "idle") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase]);
}
