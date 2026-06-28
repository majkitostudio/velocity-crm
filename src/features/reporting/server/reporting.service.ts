import "server-only";

import { ForbiddenError } from "@/src/domain/errors";
import { canManageCompanyData, requireCurrentUser } from "@/src/server/auth/guards";

import {
  parseReportingPeriodKey,
  resolveReportingPeriod,
} from "../lib/reporting-period";
import {
  computeConversionRatePercent,
  formatCents,
  sumLineRevenueCents,
} from "../lib/sum-line-revenue";
import type {
  CallOutcomeCounts,
  OperatorReportingRow,
  ReportingDashboardView,
} from "../types";
import {
  findCallCountsByOperatorForCompany,
  findCallOutcomeCountsForCompany,
  findOperatorsForReporting,
  findOrderOutcomeCountsByOperatorForCompany,
  findOrdersWithItemsForCompany,
} from "./reporting.repository";

function emptyOutcomeCounts(): CallOutcomeCounts {
  return {
    ORDER: 0,
    FAIL: 0,
    CALL_LATER: 0,
    SCHEDULE_CALL: 0,
  };
}

function mapOutcomeCounts(
  groups: Awaited<ReturnType<typeof findCallOutcomeCountsForCompany>>,
): CallOutcomeCounts {
  const counts = emptyOutcomeCounts();

  for (const group of groups) {
    counts[group.outcome] = group._count._all;
  }

  return counts;
}

function buildOperatorRows(input: {
  operators: Awaited<ReturnType<typeof findOperatorsForReporting>>;
  callCountsByOperator: Awaited<ReturnType<typeof findCallCountsByOperatorForCompany>>;
  orderOutcomeCountsByOperator: Awaited<
    ReturnType<typeof findOrderOutcomeCountsByOperatorForCompany>
  >;
  orders: Awaited<ReturnType<typeof findOrdersWithItemsForCompany>>;
}): OperatorReportingRow[] {
  const callsByOperator = new Map(
    input.callCountsByOperator.map((row) => [row.operatorId, row._count._all]),
  );
  const orderOutcomeByOperator = new Map(
    input.orderOutcomeCountsByOperator.map((row) => [row.operatorId, row._count._all]),
  );
  const ordersByOperator = new Map<string, { count: number; revenueCents: bigint }>();

  for (const order of input.orders) {
    const current = ordersByOperator.get(order.operatorId) ?? {
      count: 0,
      revenueCents: BigInt(0),
    };
    current.count += 1;
    current.revenueCents += sumLineRevenueCents(order.items);
    ordersByOperator.set(order.operatorId, current);
  }

  return input.operators.map((operator) => {
    const calls = callsByOperator.get(operator.id) ?? 0;
    const orderOutcomeCalls = orderOutcomeByOperator.get(operator.id) ?? 0;
    const orderStats = ordersByOperator.get(operator.id) ?? {
      count: 0,
      revenueCents: BigInt(0),
    };

    return {
      operatorId: operator.id,
      name: operator.name,
      email: operator.email,
      calls,
      orderOutcomeCalls,
      orders: orderStats.count,
      orderRevenue: formatCents(orderStats.revenueCents),
      conversionRatePercent: computeConversionRatePercent(orderOutcomeCalls, calls),
    };
  });
}

export async function getReportingDashboardView(input: {
  period?: string | string[] | undefined;
}): Promise<ReportingDashboardView> {
  const currentUser = await requireCurrentUser();

  if (!canManageCompanyData(currentUser.role)) {
    throw new ForbiddenError();
  }

  const periodKey = parseReportingPeriodKey(input.period);
  const period = resolveReportingPeriod(periodKey);
  const range = { from: period.from, to: period.to };

  const [
    outcomeGroups,
    callCountsByOperator,
    orderOutcomeCountsByOperator,
    orders,
    operators,
  ] = await Promise.all([
    findCallOutcomeCountsForCompany({
      companyId: currentUser.companyId,
      range,
    }),
    findCallCountsByOperatorForCompany({
      companyId: currentUser.companyId,
      range,
    }),
    findOrderOutcomeCountsByOperatorForCompany({
      companyId: currentUser.companyId,
      range,
    }),
    findOrdersWithItemsForCompany({
      companyId: currentUser.companyId,
      range,
    }),
    findOperatorsForReporting(currentUser.companyId),
  ]);

  const callsByOutcome = mapOutcomeCounts(outcomeGroups);
  const totalCalls = Object.values(callsByOutcome).reduce((sum, count) => sum + count, 0);
  const orderOutcomeCalls = callsByOutcome.ORDER;
  const totalRevenueCents = sumLineRevenueCents(
    orders.flatMap((order) => order.items),
  );

  return {
    period: {
      key: period.key,
      label: period.label,
      from: period.from.toISOString(),
      to: period.to.toISOString(),
    },
    totals: {
      calls: totalCalls,
      orders: orders.length,
      orderRevenue: formatCents(totalRevenueCents),
      orderOutcomeCalls,
      conversionRatePercent: computeConversionRatePercent(orderOutcomeCalls, totalCalls),
    },
    callsByOutcome,
    operators: buildOperatorRows({
      operators,
      callCountsByOperator,
      orderOutcomeCountsByOperator,
      orders,
    }),
  };
}

