import type { PipelineClock } from "../shared/ai-service-pipeline.types";

import { AiContactSummaryService } from "./contact-summary.service";

const systemClock: PipelineClock = {
  now() {
    return new Date().toISOString();
  },
  nowMs() {
    return Date.now();
  },
};

let contactSummaryService: AiContactSummaryService | null = null;

export function getContactSummaryService(): AiContactSummaryService {
  if (!contactSummaryService) {
    contactSummaryService = new AiContactSummaryService({ clock: systemClock });
  }
  return contactSummaryService;
}

export function createContactSummaryService(deps: {
  clock: PipelineClock;
}): AiContactSummaryService {
  return new AiContactSummaryService(deps);
}
