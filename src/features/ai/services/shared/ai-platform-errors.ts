import { DomainError } from "@/src/domain/errors";

export class NotImplementedError extends DomainError {
  constructor(message: string) {
    super(message, "NOT_IMPLEMENTED");
    this.name = "NotImplementedError";
  }
}

export class UnsupportedOperationError extends DomainError {
  constructor(message: string) {
    super(message, "UNSUPPORTED_OPERATION");
    this.name = "UnsupportedOperationError";
  }
}

export class AiCapabilityError extends DomainError {
  constructor(message: string) {
    super(message, "AI_CAPABILITY_ERROR");
    this.name = "AiCapabilityError";
  }
}

export class AiFeatureDisabledError extends DomainError {
  constructor(message: string) {
    super(message, "AI_FEATURE_DISABLED");
    this.name = "AiFeatureDisabledError";
  }
}
