import type { CurrentUser } from "@/src/server/auth/guards";
import { canManageCompanyData } from "@/src/server/auth/guards";
import type {
  ManagerAssignmentPanelView,
  OperatorQueueSnapshot,
} from "@/src/features/operator-queue/types";
import { DashboardOverview } from "@/src/features/operator-queue/components/dashboard-overview";
import { EmptyQueueState } from "@/src/features/operator-queue/components/empty-queue-state";
import { ManagerUnassignedLeadsPanel } from "@/src/features/operator-queue/components/manager-unassigned-leads-panel";
import { QueueItemRow } from "@/src/features/operator-queue/components/queue-item-row";

type OperatorDashboardProps = {
  user: CurrentUser;
  queue: OperatorQueueSnapshot;
  managerPanel?: ManagerAssignmentPanelView | null;
};

function QueueGroupHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="sticky top-14 z-10 -mx-1 bg-zinc-50/95 px-1 py-2 backdrop-blur">
      <h2 className="text-sm font-semibold text-zinc-900">
        {title}
        <span className="ml-2 text-xs font-normal text-zinc-500">({count})</span>
      </h2>
    </div>
  );
}

export function OperatorDashboard({ user, queue, managerPanel }: OperatorDashboardProps) {
  const isManagerView = canManageCompanyData(user.role);

  return (
    <div className="space-y-8" data-testid="operator-dashboard">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {user.role === "OPERATOR"
            ? "Vaše pracovní fronta na dnešek."
            : isManagerView
              ? "Správa fronty a nepřiřazených leadů."
              : `Pracovní fronta pro ${user.name ?? user.email}.`}
        </p>
      </div>

      {managerPanel ? <ManagerUnassignedLeadsPanel panel={managerPanel} /> : null}

      <DashboardOverview counts={queue.counts} />

      {queue.counts.total === 0 ? (
        <EmptyQueueState
          title="Fronta je prázdná"
          description="Callbacky k vyřízení a přiřazené leady se zde zobrazí, až budou připravené k volání."
        />
      ) : (
        <section className="space-y-4" data-testid="operator-queue">
          {queue.callbacks.length > 0 ? (
            <div className="space-y-2" data-testid="queue-callbacks-list">
              <QueueGroupHeader title="Callbacky k vyřízení" count={queue.callbacks.length} />
              {queue.callbacks.map((item, index) => (
                <QueueItemRow key={item.callbackId} item={item} position={index + 1} />
              ))}
            </div>
          ) : null}

          {queue.leads.length > 0 ? (
            <div className="space-y-2" data-testid="queue-leads-list">
              <QueueGroupHeader title="Přiřazené leady" count={queue.leads.length} />
              {queue.leads.map((item, index) => (
                <QueueItemRow
                  key={item.contact.id}
                  item={item}
                  position={queue.callbacks.length + index + 1}
                />
              ))}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
