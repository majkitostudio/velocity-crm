import type { OperatorQueueLeadItem } from "@/src/features/operator-queue/types";

import { EmptyQueueState } from "./empty-queue-state";
import { QueueItemRow } from "./queue-item-row";

type QueueLeadsSectionProps = {
  leads: OperatorQueueLeadItem[];
  queueOffset: number;
};

export function QueueLeadsSection({ leads, queueOffset }: QueueLeadsSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Assigned leads</h2>
        <p className="text-sm text-zinc-600">
          Leads assigned to you, sorted by priority and age.
        </p>
      </div>

      {leads.length === 0 ? (
        <EmptyQueueState
          title="No assigned leads"
          description="New leads assigned to you will appear in this section."
        />
      ) : (
        <div className="space-y-3">
          {leads.map((item, index) => (
            <QueueItemRow
              key={item.contact.id}
              item={item}
              position={queueOffset + index + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
