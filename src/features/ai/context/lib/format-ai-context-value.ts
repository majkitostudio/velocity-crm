export function formatAiContextDate(value: Date): string {
  return value.toISOString();
}

export function formatAiContextDecimal(value: { toString(): string }): string {
  return value.toString();
}
