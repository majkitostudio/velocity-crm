-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ContactImportBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "fileName" TEXT,
    "status" "ImportBatchStatus" NOT NULL,
    "stats" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactImportBatch_companyId_createdAt_idx" ON "ContactImportBatch"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContactImportBatch" ADD CONSTRAINT "ContactImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactImportBatch" ADD CONSTRAINT "ContactImportBatch_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
