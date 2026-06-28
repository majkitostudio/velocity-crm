import { CallOutcome } from "@/src/generated/prisma/client";

import { getCallOutcomeLabel } from "../lib/call-outcome-labels";
import type { ReportingDashboardView } from "../types";
import { ReportsPeriodPicker } from "./reports-period-picker";

type ReportsDashboardProps = {
  view: ReportingDashboardView;
};

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
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

function formatPercent(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${value.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} %`;
}

function formatOperatorName(name: string | null, email: string): string {
  return name?.trim() || email;
}

const OUTCOME_ORDER: CallOutcome[] = [
  CallOutcome.ORDER,
  CallOutcome.SCHEDULE_CALL,
  CallOutcome.CALL_LATER,
  CallOutcome.FAIL,
];

export function ReportsDashboard({ view }: ReportsDashboardProps) {
  const activeOperators = view.operators.filter(
    (operator) => operator.calls > 0 || operator.orders > 0,
  );

  return (
    <div className="space-y-8" data-testid="reports-dashboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Přehledy</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manažerské statistiky hovorů, objednávek a výkonu operátorů.
          </p>
          <p className="mt-1 text-xs text-zinc-500">{view.period.label}</p>
        </div>
        <ReportsPeriodPicker activePeriod={view.period.key} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Hovory celkem"
          value={view.totals.calls.toString()}
          hint="Dokončené výsledky hovorů"
        />
        <MetricCard
          label="Objednávky"
          value={view.totals.orders.toString()}
          hint="Vytvořené objednávky (bez zrušených)"
        />
        <MetricCard
          label="Tržby z objednávek"
          value={`${view.totals.orderRevenue} Kč`}
          hint="Součet položek objednávek"
        />
        <MetricCard
          label="Konverze hovorů"
          value={formatPercent(view.totals.conversionRatePercent)}
          hint="Podíl hovorů s výsledkem Objednávka"
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Výsledky hovorů</h2>
        </div>
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {OUTCOME_ORDER.map((outcome) => (
            <div key={outcome} className="rounded-lg bg-zinc-50 px-3 py-3">
              <p className="text-xs text-zinc-500">{getCallOutcomeLabel(outcome)}</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {view.callsByOutcome[outcome]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Výkon operátorů</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Operátoři s aktivitou ve zvoleném období.
          </p>
        </div>

        {activeOperators.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500" data-testid="reports-operators-empty">
            Ve zvoleném období zatím nejsou žádné hovory ani objednávky.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm" data-testid="reports-operators-table">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Operátor</th>
                  <th className="px-4 py-3 font-medium">Hovory</th>
                  <th className="px-4 py-3 font-medium">Objednávky</th>
                  <th className="px-4 py-3 font-medium">Tržby</th>
                  <th className="px-4 py-3 font-medium">Konverze</th>
                </tr>
              </thead>
              <tbody>
                {activeOperators.map((operator) => (
                  <tr
                    key={operator.operatorId}
                    className="border-b border-zinc-100 last:border-b-0"
                    data-testid={`reports-operator-row-${operator.operatorId}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {formatOperatorName(operator.name, operator.email)}
                      </p>
                      <p className="text-xs text-zinc-500">{operator.email}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{operator.calls}</td>
                    <td className="px-4 py-3 text-zinc-700">{operator.orders}</td>
                    <td className="px-4 py-3 text-zinc-700">{operator.orderRevenue} Kč</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatPercent(operator.conversionRatePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
