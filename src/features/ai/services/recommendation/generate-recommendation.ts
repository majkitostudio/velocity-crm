import "server-only";

import type { AiServiceExecuteInput } from "../shared/ai-task-service";
import type { PipelinePorts } from "../shared/ai-service-pipeline.types";
import { runAiServicePipeline } from "../shared/run-ai-service-pipeline";

import { createRecommendationPipelinePorts } from "./create-recommendation-pipeline-ports";
import { getRecommendationService } from "./get-recommendation-service";
import type { ContactRecommendation } from "./recommendation.schema";
import type { RecommendationViewModel } from "./recommendation.types";

export async function generateRecommendation(
  input: AiServiceExecuteInput,
  ports?: PipelinePorts<ContactRecommendation>,
): Promise<RecommendationViewModel> {
  return runAiServicePipeline(
    getRecommendationService(),
    input,
    ports ?? createRecommendationPipelinePorts(),
  );
}
