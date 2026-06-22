import "server-only";

import type { AiServiceExecuteInput } from "../shared/ai-task-service";
import { runAiServicePipeline } from "../shared/run-ai-service-pipeline";

import { createContactSummaryPipelinePorts } from "./create-contact-summary-pipeline-ports";
import { getContactSummaryService } from "./get-contact-summary-service";
import type { SummaryViewModel } from "./contact-summary.types";

export async function generateContactSummary(
  input: AiServiceExecuteInput,
): Promise<SummaryViewModel> {
  return runAiServicePipeline(
    getContactSummaryService(),
    input,
    createContactSummaryPipelinePorts(),
  );
}
