import {
  expandLegacySections,
  type BuildContactContextOptions,
} from "@/src/features/contacts/context/types/build-options";

import type { BuildContactAiContextOptions } from "../types/build-options";

export function mapAiBuildOptionsToContactContextOptions(
  options?: BuildContactAiContextOptions,
): BuildContactContextOptions {
  if (!options) {
    return {};
  }

  const mapped: BuildContactContextOptions = {
    limits: options.limits,
    includeHistory: options.includeHistory,
    includeStatistics: options.includeStatistics,
    includeSensitiveData: options.includeSensitiveData,
    includeMetadata: options.includeMetadata,
  };

  if (options.sections !== undefined) {
    mapped.sections = expandLegacySections(options.sections);
  }

  return mapped;
}
