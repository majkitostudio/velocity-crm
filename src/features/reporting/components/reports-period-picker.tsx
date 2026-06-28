import Link from "next/link";

import type { ReportingPeriodKey } from "../lib/reporting-period";
import { listReportingPeriodOptions } from "../lib/reporting-period";

type ReportsPeriodPickerProps = {
  activePeriod: ReportingPeriodKey;
};

export function ReportsPeriodPicker({ activePeriod }: ReportsPeriodPickerProps) {
  const options = listReportingPeriodOptions();

  return (
    <div className="flex flex-wrap gap-2" data-testid="reports-period-picker">
      {options.map((option) => {
        const isActive = option.key === activePeriod;

        return (
          <Link
            key={option.key}
            href={`/reports?period=${option.key}`}
            className={
              isActive
                ? "rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900"
            }
            data-testid={`reports-period-${option.key}`}
            aria-current={isActive ? "page" : undefined}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
