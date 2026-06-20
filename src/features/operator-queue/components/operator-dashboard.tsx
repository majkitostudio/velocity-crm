import type { CurrentUser } from "@/src/server/auth/guards";
import type { OperatorQueueSnapshot } from "@/src/features/operator-queue/types";
import { DashboardOverview } from "@/src/features/operator-queue/components/dashboard-overview";
import { EmptyQueueState } from "@/src/features/operator-queue/components/empty-queue-state";
import { QueueCallbacksSection } from "@/src/features/operator-queue/components/queue-callbacks-section";
import { QueueLeadsSection } from "@/src/features/operator-queue/components/queue-leads-section";
import { QueueItemRow } from "@/src/features/operator-queue/components/queue-item-row";

type OperatorDashboardProps = {
  user: CurrentUser;
  queue: OperatorQueueSnapshot;
};

export function OperatorDashboard({ user, queue }: OperatorDashboardProps) {
  return (
    <div className="space-y-8" data-testid="operator-dashboard">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {user.role === "OPERATOR"
            ? "Your work queue for today."
            : `Work queue for ${user.name ?? user.email}.`}
        </p>
      </div>

      <DashboardOverview counts={queue.counts} />

      {queue.counts.total === 0 ? (
        <EmptyQueueState
          title="Your queue is empty"
          description="Due callbacks and assigned leads will appear here when they are ready to work."
        />
      ) : (
        <>
          <section className="space-y-3" data-testid="operator-full-queue">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Full queue</h2>
              <p className="text-sm text-zinc-600">
                Combined order: callbacks first, then leads. Priority and age apply
                within each group.
              </p>
            </div>
            <div className="space-y-3" data-testid="operator-full-queue-list">
              {queue.items.map((item, index) => (
                <QueueItemRow
                  key={item.kind === "CALLBACK" ? item.callbackId : item.contact.id}
                  item={item}
                  position={index + 1}
                />
              ))}
            </div>
          </section>

          <QueueCallbacksSection
            callbacks={queue.callbacks}
            queueOffset={0}
          />
          <QueueLeadsSection leads={queue.leads} queueOffset={queue.callbacks.length} />
        </>
      )}
    </div>
  );
}
