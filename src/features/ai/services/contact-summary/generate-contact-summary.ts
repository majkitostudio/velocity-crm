import "server-only";

import type { AiServiceExecuteInput } from "../shared/ai-task-service";
import type { PipelinePorts } from "../shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../shared/run-ai-service-pipeline";

import { createContactSummaryPipelinePorts } from "./create-contact-summary-pipeline-ports";
import { getContactSummaryService } from "./get-contact-summary-service";
import type { ContactSummary } from "./contact-summary.schema";
import type { SummaryViewModel } from "./contact-summary.types";

export async function generateContactSummary(
  input: AiServiceExecuteInput,
  ports?: PipelinePorts<ContactSummary>,
): Promise<SummaryViewModel> {
  return runAiServicePipeline(
    getContactSummaryService(),
    input,
    ports ?? createContactSummaryPipelinePorts(),
  );
}
