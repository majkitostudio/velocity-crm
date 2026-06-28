export type ReportingPeriodKey = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<ReportingPeriodKey, string> = {
  "7d": "Posledních 7 dní",
  "30d": "Posledních 30 dní",
  "90d": "Posledních 90 dní",
};

const PERIOD_DAYS: Record<ReportingPeriodKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function listReportingPeriodOptions(): {
  key: ReportingPeriodKey;
  label: string;
}[] {
  return [
    { key: "7d", label: "7 dní" },
    { key: "30d", label: "30 dní" },
    { key: "90d", label: "90 dní" },
  ];
}

export function parseReportingPeriodKey(
  value: string | string[] | undefined,
): ReportingPeriodKey {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === "7d" || raw === "30d" || raw === "90d") {
    return raw;
  }

  return "30d";
}

export function resolveReportingPeriod(key: ReportingPeriodKey): {
  key: ReportingPeriodKey;
  label: string;
  from: Date;
  to: Date;
} {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - PERIOD_DAYS[key]);
  from.setHours(0, 0, 0, 0);

  return {
    key,
    label: PERIOD_LABELS[key],
    from,
    to,
  };
}
