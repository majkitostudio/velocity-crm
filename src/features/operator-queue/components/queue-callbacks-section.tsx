import type { OperatorQueueCallbackItem } from "@/src/features/operator-queue/types";

import { EmptyQueueState } from "./empty-queue-state";
import { QueueItemRow } from "./queue-item-row";

type QueueCallbacksSectionProps = {
  callbacks: OperatorQueueCallbackItem[];
  queueOffset: number;
};

export function QueueCallbacksSection({
  callbacks,
  queueOffset,
}: QueueCallbacksSectionProps) {
  return (
    <section className="space-y-3" data-testid="queue-callbacks-section">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Due callbacks</h2>
        <p className="text-sm text-zinc-600">
          Open callbacks scheduled for now or earlier, sorted by priority.
        </p>
      </div>

      {callbacks.length === 0 ? (
        <EmptyQueueState
          title="No callbacks due"
          description="Scheduled callbacks will appear here when they are ready to call."
        />
      ) : (
        <div className="space-y-3" data-testid="queue-callbacks-list">
          {callbacks.map((item, index) => (
            <QueueItemRow
              key={item.callbackId}
              item={item}
              position={queueOffset + index + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
