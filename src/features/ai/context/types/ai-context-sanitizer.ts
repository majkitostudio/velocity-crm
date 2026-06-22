import type { ContactAiContext } from "./contact-ai-context";

export type AiContextSanitizeOptions = {
  includeSensitiveData?: boolean;
  taskProfile?: string;
};

/**
 * Slice 11 — interface only. Full PII redaction implementation in Slice 12.
 */
export type AiContextSanitizer = {
  sanitize(
    context: ContactAiContext,
    options?: AiContextSanitizeOptions,
  ): ContactAiContext;
};

export const passthroughAiContextSanitizer: AiContextSanitizer = {
  sanitize(context) {
    return context;
  },
};
