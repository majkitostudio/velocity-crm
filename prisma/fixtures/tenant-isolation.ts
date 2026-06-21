/** Stable IDs for cross-tenant isolation tests (seed + integration + E2E). */
export const TENANT_ISOLATION_SEED = {
  otherCompanyId: "seed-company-other",
  otherCompanyName: "Other Tenant Call Center",
  otherOperatorEmail: "operator@other-tenant.local",
  otherOperatorPassword: "changeme-other-operator",
  otherContactId: "seed-contact-other-tenant",
  otherActivityId: "seed-activity-other-contact-created",
} as const;
