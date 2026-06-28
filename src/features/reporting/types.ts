import type { CallOutcome } from "@/src/generated/prisma/client";

import type { ReportingPeriodKey } from "./lib/reporting-period";

export type CallOutcomeCounts = Record<CallOutcome, number>;

export type OperatorReportingRow = {
  operatorId: string;
  name: string | null;
  email: string;
  calls: number;
  orderOutcomeCalls: number;
  orders: number;
  orderRevenue: string;
  conversionRatePercent: number | null;
};

export type ReportingDashboardView = {
  period: {
    key: ReportingPeriodKey;
    label: string;
    from: string;
    to: string;
  };
  totals: {
    calls: number;
    orders: number;
    orderRevenue: string;
    orderOutcomeCalls: number;
    conversionRatePercent: number | null;
  };
  callsByOutcome: CallOutcomeCounts;
  operators: OperatorReportingRow[];
};
