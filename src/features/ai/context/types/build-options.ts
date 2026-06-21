export const CONTACT_AI_CONTEXT_SCHEMA_VERSION = 1 as const;

export type ContactAiContextSection =
  | "contact"
  | "snapshot"
  | "history"
  | "statistics";

export type ContactAiContextLimits = {
  activity?: number;
  orders?: number;
  notes?: number;
  recentClosedCallbacks?: number;
};

export type BuildContactAiContextOptions = {
  /** Selective sections; when omitted, derived from includeHistory / includeStatistics. */
  sections?: ContactAiContextSection[];
  limits?: ContactAiContextLimits;
  /** Default: true */
  includeHistory?: boolean;
  /** Default: true */
  includeStatistics?: boolean;
  /** Default: true — future PII redaction when false */
  includeSensitiveData?: boolean;
  /** Default: false — non-deterministic metadata for runtime/cache scenarios */
  includeMetadata?: boolean;
};

export type ResolvedBuildContactAiContextOptions = {
  sections: ReadonlySet<ContactAiContextSection>;
  limits: Required<ContactAiContextLimits>;
  includeSensitiveData: boolean;
  includeMetadata: boolean;
};

export const DEFAULT_CONTACT_AI_CONTEXT_LIMITS: Required<ContactAiContextLimits> = {
  activity: 100,
  orders: 10,
  notes: 20,
  recentClosedCallbacks: 5,
};

export function resolveBuildContactAiContextOptions(
  options?: BuildContactAiContextOptions,
): ResolvedBuildContactAiContextOptions {
  const includeHistory = options?.includeHistory !== false;
  const includeStatistics = options?.includeStatistics !== false;

  const sections =
    options?.sections !== undefined
      ? new Set(options.sections)
      : new Set<ContactAiContextSection>([
          "contact",
          "snapshot",
          ...(includeHistory ? (["history"] as const) : []),
          ...(includeStatistics ? (["statistics"] as const) : []),
        ]);

  return {
    sections,
    limits: {
      activity: options?.limits?.activity ?? DEFAULT_CONTACT_AI_CONTEXT_LIMITS.activity,
      orders: options?.limits?.orders ?? DEFAULT_CONTACT_AI_CONTEXT_LIMITS.orders,
      notes: options?.limits?.notes ?? DEFAULT_CONTACT_AI_CONTEXT_LIMITS.notes,
      recentClosedCallbacks:
        options?.limits?.recentClosedCallbacks ??
        DEFAULT_CONTACT_AI_CONTEXT_LIMITS.recentClosedCallbacks,
    },
    includeSensitiveData: options?.includeSensitiveData !== false,
    includeMetadata: options?.includeMetadata === true,
  };
}
