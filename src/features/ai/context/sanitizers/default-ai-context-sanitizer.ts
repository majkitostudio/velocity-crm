import { NotImplementedError } from "@/src/features/ai/services/shared/ai-platform-errors";

import type { ContactAiContext } from "../types/contact-ai-context";
import type { SanitizerProfile } from "../types/sanitizer-profile";
import type { AiContextSanitizeOptions, AiContextSanitizer } from "../types/ai-context-sanitizer";

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "—";
  }
  if (parts.length === 1) {
    return `${parts[0]!.charAt(0).toUpperCase()}.`;
  }
  return parts
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(" ");
}

function sanitizeRecommendationProfile(context: ContactAiContext): ContactAiContext {
  // Same PII rules as SUMMARY; callback scheduledAt is preserved for timing decisions.
  return sanitizeSummaryProfile(context);
}

function sanitizeSummaryProfile(context: ContactAiContext): ContactAiContext {
  return {
    ...context,
    contact: {
      ...context.contact,
      name: toInitials(context.contact.name),
      phone: null,
      email: null,
      address: {
        ...context.contact.address,
        street: null,
        zipCode: null,
      },
    },
    snapshot: {
      ...context.snapshot,
      workflow: {
        ...context.snapshot.workflow,
        lastCall: context.snapshot.workflow.lastCall
          ? {
              ...context.snapshot.workflow.lastCall,
              note: null,
            }
          : null,
      },
      callbacks: {
        open: context.snapshot.callbacks.open.map((callback) => ({
          ...callback,
          note: null,
        })),
        recentClosed: context.snapshot.callbacks.recentClosed.map((callback) => ({
          ...callback,
          note: null,
        })),
      },
      notes: {
        recent: context.snapshot.notes.recent.map((note) => ({
          ...note,
          body: "[redacted]",
        })),
      },
      orders: {
        recent: context.snapshot.orders.recent.map((order) => ({
          ...order,
          note: order.note ? "[redacted]" : null,
        })),
      },
    },
  };
}

function resolveProfile(options?: AiContextSanitizeOptions): SanitizerProfile {
  if (options?.profile) {
    return options.profile;
  }
  return "SUMMARY";
}

export const defaultAiContextSanitizer: AiContextSanitizer = {
  sanitize(context, options) {
    if (options?.includeSensitiveData === true) {
      return context;
    }

    const profile = resolveProfile(options);

    switch (profile) {
      case "SUMMARY":
        return sanitizeSummaryProfile(context);
      case "RECOMMENDATION":
        return sanitizeRecommendationProfile(context);
      case "CALL_PREPARATION":
      case "EMAIL_DRAFT":
      case "SMS_DRAFT":
        throw new NotImplementedError(
          `Sanitizer profile "${profile}" is not implemented yet`,
        );
      default: {
        const _exhaustive: never = profile;
        return _exhaustive;
      }
    }
  },
};
