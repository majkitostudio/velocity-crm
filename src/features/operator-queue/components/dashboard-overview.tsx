import type { OperatorQueueSnapshot } from "@/src/features/operator-queue/types";

type DashboardOverviewProps = {
  counts: OperatorQueueSnapshot["counts"];
};

function OverviewCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

export function DashboardOverview({ counts }: DashboardOverviewProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <OverviewCard
        label="Callbacky k vyřízení"
        value={counts.callbacks}
        hint="Připravené k volání"
      />
      <OverviewCard
        label="Přiřazené leady"
        value={counts.leads}
        hint="Čekají ve frontě"
      />
      <OverviewCard
        label="Celkem ve frontě"
        value={counts.total}
        hint="Nejdřív callbacky, pak leady"
      />
    </section>
  );
}
