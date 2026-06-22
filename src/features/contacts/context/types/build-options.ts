export const CONTACT_CONTEXT_SCHEMA_VERSION = 1 as const;

export type ContactContextSection =
  | "contact"
  | "snapshot.workflow"
  | "snapshot.callbacks"
  | "snapshot.notes"
  | "snapshot.orders"
  | "snapshot.products"
  | "history"
  | "statistics";

/** Legacy top-level sections from Slice 10 AI API — expanded to sub-sections internally. */
export type LegacyContactContextSection =
  | "contact"
  | "snapshot"
  | "history"
  | "statistics";

export type ContactContextLimits = {
  activity?: number;
  orders?: number;
  /** Omit or null for unlimited (Contact Detail). */
  notes?: number | null;
  recentClosedCallbacks?: number;
};

export type BuildContactContextOptions = {
  sections?: ContactContextSection[];
  limits?: ContactContextLimits;
  /** Default: true */
  includeHistory?: boolean;
  /** Default: true */
  includeStatistics?: boolean;
  /** Default: true — PII redaction for downstream consumers that opt in */
  includeSensitiveData?: boolean;
  /** Default: false — non-deterministic metadata for runtime/cache scenarios */
  includeMetadata?: boolean;
};

export type ResolvedContactContextLimits = {
  activity: number;
  orders: number;
  notes: number | null;
  recentClosedCallbacks: number;
};

export type ResolvedBuildContactContextOptions = {
  sections: ReadonlySet<ContactContextSection>;
  limits: ResolvedContactContextLimits;
  includeSensitiveData: boolean;
  includeMetadata: boolean;
};

export const DEFAULT_CONTACT_CONTEXT_LIMITS: ResolvedContactContextLimits = {
  activity: 100,
  orders: 10,
  notes: 20,
  recentClosedCallbacks: 5,
};

export const CONTACT_DETAIL_SECTIONS = [
  "contact",
  "snapshot.workflow",
  "snapshot.callbacks",
  "snapshot.notes",
] as const satisfies readonly ContactContextSection[];

export const CONTACT_DETAIL_CONTEXT_OPTIONS = {
  sections: [...CONTACT_DETAIL_SECTIONS],
  includeHistory: false,
  includeStatistics: false,
  limits: {
    notes: null,
  },
} as const satisfies BuildContactContextOptions;

export const AI_FULL_SECTIONS = [
  "contact",
  "snapshot.workflow",
  "snapshot.callbacks",
  "snapshot.notes",
  "snapshot.orders",
  "snapshot.products",
  "history",
  "statistics",
] as const satisfies readonly ContactContextSection[];

const SNAPSHOT_SUB_SECTIONS: readonly ContactContextSection[] = [
  "snapshot.workflow",
  "snapshot.callbacks",
  "snapshot.notes",
  "snapshot.orders",
  "snapshot.products",
];

export function expandLegacySections(
  sections: readonly LegacyContactContextSection[],
): ContactContextSection[] {
  const expanded = new Set<ContactContextSection>();

  for (const section of sections) {
    if (section === "snapshot") {
      for (const subSection of SNAPSHOT_SUB_SECTIONS) {
        expanded.add(subSection);
      }
      continue;
    }

    expanded.add(section);
  }

  return [...expanded];
}

export function resolveBuildContactContextOptions(
  options?: BuildContactContextOptions,
): ResolvedBuildContactContextOptions {
  const includeHistory = options?.includeHistory !== false;
  const includeStatistics = options?.includeStatistics !== false;

  const sections =
    options?.sections !== undefined
      ? new Set(options.sections)
      : new Set<ContactContextSection>([
          "contact",
          ...SNAPSHOT_SUB_SECTIONS,
          ...(includeHistory ? (["history"] as const) : []),
          ...(includeStatistics ? (["statistics"] as const) : []),
        ]);

  return {
    sections,
    limits: {
      activity: options?.limits?.activity ?? DEFAULT_CONTACT_CONTEXT_LIMITS.activity,
      orders: options?.limits?.orders ?? DEFAULT_CONTACT_CONTEXT_LIMITS.orders,
      notes:
        options?.limits?.notes !== undefined
          ? options.limits.notes
          : DEFAULT_CONTACT_CONTEXT_LIMITS.notes,
      recentClosedCallbacks:
        options?.limits?.recentClosedCallbacks ??
        DEFAULT_CONTACT_CONTEXT_LIMITS.recentClosedCallbacks,
    },
    includeSensitiveData: options?.includeSensitiveData !== false,
    includeMetadata: options?.includeMetadata === true,
  };
}
