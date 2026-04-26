-- M012: Sponsor Checkout — enums, SponsoredMeal (status/expiresAt/updatedAt), SponsorPurchase (nullable sponsorId, guestEmail, marmitariaId, paymentMethod, paymentStatus)
-- Executar APÓS M011
-- module-13-sponsor-checkout/TASK-1/ST001

-- 1. Enums de pagamento (module-13)
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD');
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
CREATE TYPE "SponsoredMealStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'DELIVERED');

-- 2. SponsoredMeal — adicionar status, expiresAt, updatedAt, índice
ALTER TABLE "sponsored_meals"
  ADD COLUMN IF NOT EXISTS "status"     "SponsoredMealStatus" NOT NULL DEFAULT 'AVAILABLE',
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ           DEFAULT NULL, -- NULL = sem expiração (INT-100)
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ           NOT NULL DEFAULT NOW();

-- Índice composto para queries de disponibilidade
CREATE INDEX IF NOT EXISTS "sponsored_meals_marmitaria_status_idx"
  ON "sponsored_meals" ("marmitaria_id", "status");

-- 3. SponsorPurchase — schema evolution
--    a) Tornar sponsor_id nullable (guest checkout INT-034)
ALTER TABLE "sponsor_purchases"
  ALTER COLUMN "sponsor_id" DROP NOT NULL;

--    b) Adicionar guest_email (obrigatório quando sponsor_id é null)
ALTER TABLE "sponsor_purchases"
  ADD COLUMN IF NOT EXISTS "guest_email" VARCHAR(255) DEFAULT NULL;

--    c) Adicionar marmitaria_id (FK para marmitaria_profiles)
ALTER TABLE "sponsor_purchases"
  ADD COLUMN IF NOT EXISTS "marmitaria_id" UUID DEFAULT NULL;

ALTER TABLE "sponsor_purchases"
  ADD CONSTRAINT "sponsor_purchases_marmitaria_id_fkey"
  FOREIGN KEY ("marmitaria_id")
  REFERENCES "marmitaria_profiles"("id")
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

--    d) Adicionar payment_method enum
ALTER TABLE "sponsor_purchases"
  ADD COLUMN IF NOT EXISTS "payment_method" "PaymentMethod" NOT NULL DEFAULT 'PIX';

--    e) Adicionar payment_status enum (substitui o campo status VARCHAR)
ALTER TABLE "sponsor_purchases"
  ADD COLUMN IF NOT EXISTS "payment_status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING';

-- Migrar dados existentes: converter status VARCHAR → payment_status enum
UPDATE "sponsor_purchases"
SET "payment_status" = "status"::"PurchaseStatus"
WHERE "status" IN ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');

-- Remover coluna legada status (VarChar)
-- ATENÇÃO: verificar dados antes em produção
ALTER TABLE "sponsor_purchases"
  DROP COLUMN IF EXISTS "status";

-- 4. Índices adicionais
CREATE INDEX IF NOT EXISTS "IDX_sponsor_purchases_marmitaria_id"
  ON "sponsor_purchases" ("marmitaria_id");

-- 5. CHECK constraint: guest_email obrigatório quando sponsor_id é null
ALTER TABLE "sponsor_purchases"
  ADD CONSTRAINT "sponsor_purchases_guest_or_auth_chk"
  CHECK ("sponsor_id" IS NOT NULL OR "guest_email" IS NOT NULL);
