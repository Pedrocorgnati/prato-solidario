-- M012 DOWN: Reverte sponsor checkout — enums e alterações nas tabelas
-- Executar para rollback do M012

-- 1. Revertir CHECK constraint
ALTER TABLE "sponsor_purchases"
  DROP CONSTRAINT IF EXISTS "sponsor_purchases_guest_or_auth_chk";

-- 2. Revertir SponsorPurchase
ALTER TABLE "sponsor_purchases"
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING';

UPDATE "sponsor_purchases"
SET "status" = "payment_status"::TEXT;

ALTER TABLE "sponsor_purchases"
  DROP COLUMN IF EXISTS "payment_status",
  DROP COLUMN IF EXISTS "payment_method",
  DROP CONSTRAINT IF EXISTS "sponsor_purchases_marmitaria_id_fkey",
  DROP COLUMN IF EXISTS "marmitaria_id",
  DROP COLUMN IF EXISTS "guest_email";

ALTER TABLE "sponsor_purchases"
  ALTER COLUMN "sponsor_id" SET NOT NULL;

-- 3. Revertir SponsoredMeal
DROP INDEX IF EXISTS "sponsored_meals_marmitaria_status_idx";

ALTER TABLE "sponsored_meals"
  DROP COLUMN IF EXISTS "updated_at",
  DROP COLUMN IF EXISTS "expires_at",
  DROP COLUMN IF EXISTS "status";

-- 4. Remover enums
DROP INDEX IF EXISTS "IDX_sponsor_purchases_marmitaria_id";

DROP TYPE IF EXISTS "SponsoredMealStatus";
DROP TYPE IF EXISTS "PurchaseStatus";
DROP TYPE IF EXISTS "PaymentMethod";
