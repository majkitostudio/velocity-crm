import { z } from "zod";

import type { ImportBatchStats } from "./import-types";

const importBatchStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  created: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  createdContactIds: z.array(z.string()),
  skipReasons: z.object({
    duplicate_phone: z.number().int().nonnegative(),
    duplicate_email: z.number().int().nonnegative(),
    duplicate_in_file: z.number().int().nonnegative(),
    validation: z.number().int().nonnegative(),
  }),
  assignedUserId: z.string().nullable().optional(),
  assignedUserName: z.string().nullable().optional(),
});

export function parseImportBatchStats(value: unknown): ImportBatchStats | null {
  const parsed = importBatchStatsSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}
