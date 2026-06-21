-- CreateEnum
CREATE TYPE "ContactActivityKind" AS ENUM (
  'CONTACT_CREATED',
  'CONTACT_STATUS_CHANGED',
  'CONTACT_ASSIGNED',
  'CONTACT_UPDATED',
  'NOTE_CREATED',
  'CALLBACK_CREATED',
  'CALLBACK_COMPLETED',
  'CALL_FINISHED',
  'ORDER_CREATED'
);

-- CreateEnum
CREATE TYPE "ActivitySourceEntity" AS ENUM (
  'CONTACT',
  'CALL',
  'NOTE',
  'ORDER',
  'CALLBACK',
  'IMPORT_BATCH'
);

-- CreateTable
CREATE TABLE "ContactActivity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "kind" "ContactActivityKind" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "sourceEntityType" "ActivitySourceEntity",
    "sourceEntityId" TEXT,
    "correlationId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "contactId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactActivity_companyId_contactId_occurredAt_id_idx" ON "ContactActivity"("companyId", "contactId", "occurredAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "ContactActivity_companyId_contactId_kind_occurredAt_idx" ON "ContactActivity"("companyId", "contactId", "kind", "occurredAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ContactActivity_companyId_kind_sourceEntityType_sourceEntityI_key" ON "ContactActivity"("companyId", "kind", "sourceEntityType", "sourceEntityId");

-- CreateIndex
CREATE INDEX "AuditEvent_companyId_createdAt_idx" ON "AuditEvent"("companyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditEvent_companyId_contactId_createdAt_idx" ON "AuditEvent"("companyId", "contactId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditEvent_companyId_entityType_entityId_idx" ON "AuditEvent"("companyId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_companyId_actorUserId_createdAt_idx" ON "AuditEvent"("companyId", "actorUserId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ContactActivity" ADD CONSTRAINT "ContactActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactActivity" ADD CONSTRAINT "ContactActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactActivity" ADD CONSTRAINT "ContactActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
