import type { ActivityFilterGroup } from "./activity-kinds";

export function activityFilterGroupAccentClass(
  filterGroup: ActivityFilterGroup,
): string {
  switch (filterGroup) {
    case "calls":
      return "border-l-amber-400";
    case "notes":
      return "border-l-zinc-400";
    case "callbacks":
      return "border-l-sky-400";
    case "orders":
      return "border-l-emerald-500";
    case "system":
      return "border-l-violet-400";
    default:
      return "border-l-zinc-300";
  }
}

export function activityFilterGroupIcon(filterGroup: ActivityFilterGroup): string {
  switch (filterGroup) {
    case "calls":
      return "H";
    case "notes":
      return "P";
    case "callbacks":
      return "C";
    case "orders":
      return "O";
    case "system":
      return "S";
    default:
      return "•";
  }
}

export function activityKindTestId(kind: string): string {
  return `activity-${kind.toLowerCase()}-item`;
}
