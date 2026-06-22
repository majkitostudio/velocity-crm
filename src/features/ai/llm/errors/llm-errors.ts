import { DomainError } from "@/src/domain/errors";

import type { LlmVendor } from "../types/llm-vendor";

export abstract class LlmError extends DomainError {
  readonly vendor?: LlmVendor;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    options: { vendor?: LlmVendor; retryable: boolean },
  ) {
    super(message, code);
    this.name = "LlmError";
    this.vendor = options.vendor;
    this.retryable = options.retryable;
  }
}

export class LlmTimeoutError extends LlmError {
  constructor(message = "LLM request timed out", vendor?: LlmVendor) {
    super(message, "LLM_TIMEOUT", { vendor, retryable: true });
    this.name = "LlmTimeoutError";
  }
}

export class LlmRateLimitError extends LlmError {
  constructor(message = "LLM rate limit exceeded", vendor?: LlmVendor) {
    super(message, "LLM_RATE_LIMIT", { vendor, retryable: true });
    this.name = "LlmRateLimitError";
  }
}

export class LlmProviderUnavailableError extends LlmError {
  constructor(message = "LLM provider unavailable", vendor?: LlmVendor) {
    super(message, "LLM_PROVIDER_UNAVAILABLE", { vendor, retryable: true });
    this.name = "LlmProviderUnavailableError";
  }
}

export class LlmQuotaExceededError extends LlmError {
  constructor(message = "LLM quota exceeded", vendor?: LlmVendor) {
    super(message, "LLM_QUOTA_EXCEEDED", { vendor, retryable: false });
    this.name = "LlmQuotaExceededError";
  }
}

export class LlmUnsupportedModelError extends LlmError {
  constructor(message = "Unsupported LLM model", vendor?: LlmVendor) {
    super(message, "LLM_UNSUPPORTED_MODEL", { vendor, retryable: false });
    this.name = "LlmUnsupportedModelError";
  }
}

export class LlmInvalidResponseError extends LlmError {
  constructor(message = "Invalid LLM response", vendor?: LlmVendor) {
    super(message, "LLM_INVALID_RESPONSE", { vendor, retryable: false });
    this.name = "LlmInvalidResponseError";
  }
}

export class LlmSchemaValidationError extends LlmError {
  constructor(message = "LLM response failed schema validation", vendor?: LlmVendor) {
    super(message, "LLM_SCHEMA_VALIDATION", { vendor, retryable: false });
    this.name = "LlmSchemaValidationError";
  }
}

export class LlmContentFilterError extends LlmError {
  constructor(message = "LLM content filter blocked response", vendor?: LlmVendor) {
    super(message, "LLM_CONTENT_FILTER", { vendor, retryable: false });
    this.name = "LlmContentFilterError";
  }
}

export class LlmProviderNotConfiguredError extends LlmError {
  constructor(vendor: LlmVendor) {
    super(
      `LLM vendor "${vendor}" is not configured`,
      "LLM_PROVIDER_NOT_CONFIGURED",
      { vendor, retryable: false },
    );
    this.name = "LlmProviderNotConfiguredError";
  }
}

export class LlmStreamingNotSupportedError extends LlmError {
  constructor(vendor?: LlmVendor) {
    super("LLM streaming is not supported", "LLM_STREAMING_NOT_SUPPORTED", {
      vendor,
      retryable: false,
    });
    this.name = "LlmStreamingNotSupportedError";
  }
}

export function isLlmError(error: unknown): error is LlmError {
  return error instanceof LlmError;
}
