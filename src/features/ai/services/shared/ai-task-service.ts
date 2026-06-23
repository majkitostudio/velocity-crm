import type { z } from "zod";

import type { BuildContactAiContextOptions } from "@/src/features/ai/context/types/build-options";
import type { ContactAiContext } from "@/src/features/ai/context/types/contact-ai-context";
import type { AiContextSanitizeOptions } from "@/src/features/ai/context/types/ai-context-sanitizer";
import type { LlmCompletionRequest } from "@/src/features/ai/llm/types/llm-request";

import type { AiServiceDescriptor } from "../../registry/ai-service-descriptor";

export type AiServiceExecuteInput = {
  companyId: string;
  userId: string;
  userRole: "ADMIN" | "MANAGER" | "OPERATOR";
  contactId: string;
  locale?: "cs" | "en";
  force?: boolean;
  supplements?: {
    operatorInstructions?: string;
    campaignContext?: string;
    communicationSnippet?: string;
  };
};

export type AiServiceExecuteResult<TDto> = {
  dto: TDto;
  fromCache: boolean;
  aiLogId?: string;
  correlationId: string;
};

export interface AiTaskService<TDto, TViewModel> {
  readonly descriptor: AiServiceDescriptor;
  getContextOptions(): BuildContactAiContextOptions;
  getSanitizeOptions(): AiContextSanitizeOptions;
  getOutputSchema(): z.ZodSchema<TDto>;
  getLlmResponseFormat?(): LlmCompletionRequest["responseFormat"];
  computeContextHash(context: ContactAiContext): string;
  toViewModel(result: AiServiceExecuteResult<TDto>): TViewModel;
}
