export const AuditActions = {
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILURE: "auth.login.failure",
  USER_CREATED: "user.created",
  USER_ROLE_CHANGED: "user.role_changed",
  CONTACT_ASSIGNED: "contact.assigned",
  CONTACT_CREATED: "contact.created",
  CONTACT_UPDATED: "contact.updated",
  CONTACT_STATUS_CHANGED: "contact.status_changed",
  CALL_COMPLETED: "call.completed",
  ORDER_CREATED: "order.created",
  ORDER_STATUS_CHANGED: "order.status_changed",
  CALLBACK_CREATED: "callback.created",
  CALLBACK_UPDATED: "callback.updated",
  NOTE_CREATED: "note.created",
  IMPORT_BATCH_COMPLETED: "import.batch_completed",
  AI_GENERATED: "ai.generated",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

export const AuditEntityTypes = {
  USER: "User",
  CONTACT: "Contact",
  CALL_ACTIVITY: "CallActivity",
  ORDER: "Order",
  CALLBACK: "Callback",
  NOTE: "Note",
  CONTACT_IMPORT_BATCH: "ContactImportBatch",
  AI_LOG: "AiLog",
} as const;

export type AuditEntityType =
  (typeof AuditEntityTypes)[keyof typeof AuditEntityTypes];
