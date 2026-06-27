import type { Metadata } from "next";

import { OperatorDashboard } from "@/src/features/operator-queue/components/operator-dashboard";
import {
  getManagerAssignmentPanelView,
  getOperatorQueueSnapshot,
} from "@/src/features/operator-queue/server/queue.service";
import { requireCurrentUser } from "@/src/server/auth/guards";

export const metadata: Metadata = {
  title: "Dashboard — Velocity CRM",
};

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [queue, managerPanel] = await Promise.all([
    getOperatorQueueSnapshot(),
    getManagerAssignmentPanelView(),
  ]);

  return <OperatorDashboard user={user} queue={queue} managerPanel={managerPanel} />;
}
