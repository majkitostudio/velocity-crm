import { ContactActivityKind } from "@/src/domain/activity";

export type ActivityFilterGroup =
  | "all"
  | "calls"
  | "notes"
  | "callbacks"
  | "orders"
  | "system";

type ContactActivityKindDefinition = {
  label: string;
  filterGroup: ActivityFilterGroup;
  aiVisible: boolean;
  /** URL filter token when not "all" (e.g. `?activity=calls`). */
  filterToken?: string;
};

const CONTACT_ACTIVITY_KIND_DEFINITIONS: Record<
  ContactActivityKind,
  ContactActivityKindDefinition
> = {
  [ContactActivityKind.CONTACT_CREATED]: {
    label: "Kontakt vytvořen",
    filterGroup: "system",
    aiVisible: true,
    filterToken: "system",
  },
  [ContactActivityKind.CONTACT_STATUS_CHANGED]: {
    label: "Změna stavu",
    filterGroup: "system",
    aiVisible: true,
    filterToken: "system",
  },
  [ContactActivityKind.CONTACT_ASSIGNED]: {
    label: "Přiřazení operátora",
    filterGroup: "system",
    aiVisible: true,
    filterToken: "system",
  },
  [ContactActivityKind.CONTACT_UPDATED]: {
    label: "Úprava kontaktu",
    filterGroup: "system",
    aiVisible: true,
    filterToken: "system",
  },
  [ContactActivityKind.CONTACT_TAG_ADDED]: {
    label: "Tag přidán",
    filterGroup: "system",
    aiVisible: true,
    filterToken: "system",
  },
  [ContactActivityKind.CONTACT_TAG_REMOVED]: {
    label: "Tag odebrán",
    filterGroup: "system",
    aiVisible: true,
    filterToken: "system",
  },
  [ContactActivityKind.NOTE_CREATED]: {
    label: "Poznámka",
    filterGroup: "notes",
    aiVisible: true,
    filterToken: "notes",
  },
  [ContactActivityKind.CALLBACK_CREATED]: {
    label: "Callback naplánován",
    filterGroup: "callbacks",
    aiVisible: true,
    filterToken: "callbacks",
  },
  [ContactActivityKind.CALLBACK_COMPLETED]: {
    label: "Callback dokončen",
    filterGroup: "callbacks",
    aiVisible: true,
    filterToken: "callbacks",
  },
  [ContactActivityKind.CALL_FINISHED]: {
    label: "Hovor dokončen",
    filterGroup: "calls",
    aiVisible: true,
    filterToken: "calls",
  },
  [ContactActivityKind.ORDER_CREATED]: {
    label: "Objednávka",
    filterGroup: "orders",
    aiVisible: true,
    filterToken: "orders",
  },
};

export type ActivityFilterOption = {
  token: ActivityFilterGroup;
  label: string;
};

export const ACTIVITY_FILTER_OPTIONS: ActivityFilterOption[] = [
  { token: "all", label: "Vše" },
  { token: "calls", label: "Hovory" },
  { token: "notes", label: "Poznámky" },
  { token: "callbacks", label: "Callbacky" },
  { token: "orders", label: "Objednávky" },
  { token: "system", label: "Systém" },
];

export function listActivityKinds(): ContactActivityKind[] {
  return Object.values(ContactActivityKind);
}

export function getActivityKindDefinition(
  kind: ContactActivityKind,
): ContactActivityKindDefinition {
  return CONTACT_ACTIVITY_KIND_DEFINITIONS[kind];
}

export function listActivityKindsForFilter(
  filter: ActivityFilterGroup,
): ContactActivityKind[] {
  if (filter === "all") {
    return listActivityKinds();
  }

  return listActivityKinds().filter(
    (kind) => CONTACT_ACTIVITY_KIND_DEFINITIONS[kind].filterGroup === filter,
  );
}

export function isActivityKindAiVisible(kind: ContactActivityKind): boolean {
  return CONTACT_ACTIVITY_KIND_DEFINITIONS[kind].aiVisible;
}

export function parseActivityFilterGroup(
  value: string | undefined,
): ActivityFilterGroup {
  const match = ACTIVITY_FILTER_OPTIONS.find((option) => option.token === value);
  return match?.token ?? "all";
}
