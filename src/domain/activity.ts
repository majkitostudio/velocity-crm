/**
 * Contact activity domain types.
 * Prisma enums are the storage source of truth; re-exported here for stable imports
 * from workflow and service layers without coupling to generated client paths.
 */
export {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/generated/prisma/client";

export const CONTACT_ACTIVITY_KINDS = [
  "CONTACT_CREATED",
  "CONTACT_STATUS_CHANGED",
  "CONTACT_ASSIGNED",
  "CONTACT_UPDATED",
  "NOTE_CREATED",
  "CALLBACK_CREATED",
  "CALLBACK_COMPLETED",
  "CALL_FINISHED",
  "ORDER_CREATED",
] as const;

export type ContactActivityKindValue =
  (typeof CONTACT_ACTIVITY_KINDS)[number];

export const ACTIVITY_SOURCE_ENTITIES = [
  "CONTACT",
  "CALL",
  "NOTE",
  "ORDER",
  "CALLBACK",
  "IMPORT_BATCH",
] as const;

export type ActivitySourceEntityValue =
  (typeof ACTIVITY_SOURCE_ENTITIES)[number];

/** Canonical creation source stored in CONTACT_CREATED payload data. */
export const ContactCreationSource = {
  MANUAL: "MANUAL",
  CSV: "CSV",
  API: "API",
} as const;

export type ContactCreationSourceValue =
  (typeof ContactCreationSource)[keyof typeof ContactCreationSource];
