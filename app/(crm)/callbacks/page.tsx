import type { Metadata } from "next";

import { CallbacksPage } from "@/src/features/callbacks/components/callbacks-page";
import { getCallbacksPageView } from "@/src/features/callbacks/server/callbacks.service";
import type { CallbacksPageView } from "@/src/features/callbacks/types";

export const metadata: Metadata = {
  title: "Callbacky — Velocity CRM",
};

type CallbacksRouteProps = {
  searchParams: Promise<{
    operator?: string;
    status?: string;
    view?: string;
  }>;
};

function parseStatusFilter(
  value: string | undefined,
): CallbacksPageView["statusFilter"] {
  if (value === "DONE" || value === "CANCELLED") {
    return value;
  }

  return "OPEN";
}

export default async function CallbacksRoute({ searchParams }: CallbacksRouteProps) {
  const params = await searchParams;
  const activeView = params.view === "list" ? "list" : "agenda";

  const view = await getCallbacksPageView({
    operatorId: params.operator ?? null,
    statusFilter: parseStatusFilter(params.status),
  });

  return <CallbacksPage view={view} activeView={activeView} />;
}
