import { z } from "zod";

import { CONTACT_ACTIVITY_KINDS } from "@/src/domain/activity";

import { parseActivityFilterGroup } from "./activity-kinds";

export const ACTIVITY_TIMELINE_PAGE_SIZE = 25;

export const ACTIVITY_PERIOD_FILTERS = ["all", "7d", "30d", "90d"] as const;

export type ActivityPeriodFilter = (typeof ACTIVITY_PERIOD_FILTERS)[number];

export const ACTIVITY_PERIOD_OPTIONS: Array<{
  token: ActivityPeriodFilter;
  label: string;
}> = [
  { token: "all", label: "Celé období" },
  { token: "7d", label: "Posledních 7 dní" },
  { token: "30d", label: "Posledních 30 dní" },
  { token: "90d", label: "Posledních 90 dní" },
];

const activityCursorSchema = z.object({
  occurredAt: z.coerce.date(),
  id: z.string().min(1),
});

export type ActivityTimelineCursor = z.infer<typeof activityCursorSchema>;

export function parseActivityPeriodFilter(
  value: string | undefined,
): ActivityPeriodFilter {
  const match = ACTIVITY_PERIOD_FILTERS.find((token) => token === value);
  return match ?? "all";
}

export function encodeActivityTimelineCursor(cursor: ActivityTimelineCursor): string {
  return `${cursor.occurredAt.toISOString()}_${cursor.id}`;
}

export function parseActivityTimelineCursor(
  value: string | undefined,
): ActivityTimelineCursor | null {
  if (!value) {
    return null;
  }

  const separatorIndex = value.indexOf("_");

  if (separatorIndex <= 0) {
    return null;
  }

  const occurredAtRaw = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);
  const parsed = activityCursorSchema.safeParse({
    occurredAt: occurredAtRaw,
    id,
  });

  return parsed.success ? parsed.data : null;
}

export function resolveActivityOccurredAtFrom(
  period: ActivityPeriodFilter,
  now = new Date(),
): Date | undefined {
  if (period === "all") {
    return undefined;
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return from;
}

export const contactActivityTimelineQuerySchema = z.object({
  activity: z
    .string()
    .optional()
    .transform((value) => parseActivityFilterGroup(value)),
  activityPeriod: z
    .string()
    .optional()
    .transform((value) => parseActivityPeriodFilter(value)),
  activityCursor: z
    .string()
    .optional()
    .transform((value) => parseActivityTimelineCursor(value)),
});

export type ContactActivityTimelineQuery = z.infer<
  typeof contactActivityTimelineQuerySchema
>;

export function isContactActivityKindValue(
  value: string,
): value is (typeof CONTACT_ACTIVITY_KINDS)[number] {
  return (CONTACT_ACTIVITY_KINDS as readonly string[]).includes(value);
}
