-- Extend order lifecycle states.
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE "status"::text
      WHEN 'NEW' THEN 'CREATED'
      WHEN 'CONFIRMED' THEN 'PROCESSING'
      WHEN 'CANCELLED' THEN 'CANCELLED'
      ELSE 'CREATED'
    END
  )::"OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'CREATED';
DROP TYPE "OrderStatus_old";

-- Persist idempotency keys so repeated ORDER submits cannot create duplicate orders.
ALTER TABLE "CallActivity" ADD COLUMN "idempotencyKey" TEXT;
UPDATE "CallActivity" SET "idempotencyKey" = "id" WHERE "idempotencyKey" IS NULL;
ALTER TABLE "CallActivity" ALTER COLUMN "idempotencyKey" SET NOT NULL;

CREATE UNIQUE INDEX "CallActivity_companyId_operatorId_idempotencyKey_key"
  ON "CallActivity"("companyId", "operatorId", "idempotencyKey");
