export function deepFreeze<T extends object>(value: T): Readonly<T> {
  Object.freeze(value);

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
      deepFreeze(nested);
    }
  }

  return value;
}
