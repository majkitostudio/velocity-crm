import type { Metadata } from "next";

import { ReportsDashboard } from "@/src/features/reporting/components/reports-dashboard";
import { getReportingDashboardView } from "@/src/features/reporting/server/reporting.service";

export const metadata: Metadata = {
  title: "Přehledy — Velocity CRM",
};

type ReportsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsRoute({ searchParams }: ReportsRouteProps) {
  const params = await searchParams;
  const view = await getReportingDashboardView({ period: params.period });

  return <ReportsDashboard view={view} />;
}
