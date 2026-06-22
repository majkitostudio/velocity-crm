import type { PipelineClock } from "../shared/ai-service-pipeline.types";
import type { AiTaskService, AiServiceExecuteResult } from "../shared/ai-task-service";
import { computeContactContextHash } from "../../context/context-hash/compute-contact-context-hash";
import { getAiTaskConfig } from "../../config/resolve-ai-config";
import { getAiServiceDescriptor } from "../../registry/ai-service-registry";

import {
  contactSummarySchema,
  type ContactSummary,
} from "./contact-summary.schema";
import {
  mapContactSummaryToViewModel,
  type SummaryViewModel,
} from "./contact-summary.types";
import { formatSummaryPromptLabel } from "../../prompts/summary/summary-prompt-version";

export type AiContactSummaryServiceDeps = {
  clock: PipelineClock;
};

export class AiContactSummaryService
  implements AiTaskService<ContactSummary, SummaryViewModel>
{
  readonly descriptor = getAiServiceDescriptor("contact-summary");

  constructor(private readonly deps: AiContactSummaryServiceDeps) {}

  getContextOptions() {
    const taskConfig = getAiTaskConfig("SUMMARY");

    return {
      includeHistory: true,
      includeStatistics: true,
      limits: {
        activity: taskConfig.contextView?.maxHistoryItems ?? 20,
      },
      includeSensitiveData: false,
    };
  }

  getSanitizeOptions() {
    return {
      profile: this.descriptor.sanitizerProfile,
      includeSensitiveData: false,
    };
  }

  getOutputSchema() {
    return contactSummarySchema;
  }

  computeContextHash(context: Parameters<typeof computeContactContextHash>[0]) {
    return computeContactContextHash(context);
  }

  toViewModel(result: AiServiceExecuteResult<ContactSummary>): SummaryViewModel {
    return mapContactSummaryToViewModel(result, {
      generatedAt: this.deps.clock.now(),
      promptLabel: formatSummaryPromptLabel(this.descriptor.defaultPromptVersion),
    });
  }
}
