type RevenueLine = {
  quantity: number;
  unitPrice: string | { toString(): string };
};

function parsePriceToCents(value: string): bigint {
  const [wholePart, decimalPart = ""] = value.replace(",", ".").split(".");
  const centsPart = decimalPart.padEnd(2, "0").slice(0, 2);
  return BigInt(wholePart) * BigInt(100) + BigInt(centsPart);
}

export function formatCents(cents: bigint): string {
  const whole = cents / BigInt(100);
  const fraction = cents % BigInt(100);
  return `${whole.toString()}.${fraction.toString().padStart(2, "0")}`;
}

export function sumLineRevenueCents(lines: RevenueLine[]): bigint {
  let total = BigInt(0);

  for (const line of lines) {
    const unitPriceCents = parsePriceToCents(line.unitPrice.toString());
    total += unitPriceCents * BigInt(line.quantity);
  }

  return total;
}

export function computeConversionRatePercent(
  orderOutcomeCalls: number,
  totalCalls: number,
): number | null {
  if (totalCalls === 0) {
    return null;
  }

  return Math.round((orderOutcomeCalls / totalCalls) * 1000) / 10;
}
