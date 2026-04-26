-- M005: ImpactMetrics + SponsorPurchase + SponsoredMeal + MarmitariaBalance + MPConnection + ProcessedWebhook
-- NOTA: Migration retroativa para rastreabilidade.

CREATE TABLE "impact_metrics" (
  "id"                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "total_donations"   INTEGER NOT NULL DEFAULT 0,
  "total_portions"    INTEGER NOT NULL DEFAULT 0,
  "total_receptors"   INTEGER NOT NULL DEFAULT 0,
  "total_donors"      INTEGER NOT NULL DEFAULT 0,
  "total_marmitarias" INTEGER NOT NULL DEFAULT 0,
  "total_sponsored"   INTEGER NOT NULL DEFAULT 0,
  "calculated_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_impact_metrics_calculated_at" ON "impact_metrics" ("calculated_at");

CREATE TABLE "sponsor_purchases" (
  "id"              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "sponsor_id"      UUID REFERENCES "sponsor_profiles" ("id") ON DELETE SET NULL,
  "guest_email"     VARCHAR(255),
  "marmitaria_id"   UUID NOT NULL REFERENCES "marmitaria_profiles" ("id") ON DELETE RESTRICT,
  "quantity"        INTEGER NOT NULL,
  "unit_price"      DECIMAL(10, 2) NOT NULL,
  "total_amount"    DECIMAL(10, 2) NOT NULL,
  "payment_method"  "PaymentMethod" NOT NULL DEFAULT 'PIX',
  "payment_status"  "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
  "mp_payment_id"   VARCHAR(100) UNIQUE,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_sponsor_purchases_sponsor_id" ON "sponsor_purchases" ("sponsor_id");
CREATE INDEX "IDX_sponsor_purchases_marmitaria_id" ON "sponsor_purchases" ("marmitaria_id");

CREATE TABLE "sponsored_meals" (
  "id"            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "purchase_id"   UUID NOT NULL REFERENCES "sponsor_purchases" ("id") ON DELETE CASCADE,
  "donation_id"   UUID REFERENCES "donations" ("id") ON DELETE SET NULL,
  "marmitaria_id" UUID,
  "status"        "SponsoredMealStatus" NOT NULL DEFAULT 'AVAILABLE',
  "expires_at"    TIMESTAMPTZ,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON "sponsored_meals" ("marmitaria_id", "status");

CREATE TABLE "marmitaria_balances" (
  "id"                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "marmitaria_id"     UUID NOT NULL UNIQUE REFERENCES "marmitaria_profiles" ("id") ON DELETE CASCADE,
  "available_credits" INTEGER NOT NULL DEFAULT 0,
  "total_earned"      DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "total_withdrawn"   DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "mp_connections" (
  "id"                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "marmitaria_id"            UUID NOT NULL UNIQUE REFERENCES "marmitaria_profiles" ("id") ON DELETE CASCADE,
  "mp_user_id"               VARCHAR(100),
  "access_token_encrypted"   TEXT,
  "refresh_token_encrypted"  TEXT,
  "public_key"               VARCHAR(255),
  "live_mode"                BOOLEAN NOT NULL DEFAULT false,
  "expires_at"               TIMESTAMPTZ,
  "status"                   "MPConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
  "created_at"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "mp_connections_expires_at_idx" ON "mp_connections" ("expires_at");
CREATE INDEX "mp_connections_status_idx" ON "mp_connections" ("status");

CREATE TABLE "processed_webhooks" (
  "id"           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "payment_id"   VARCHAR(255) NOT NULL UNIQUE,
  "provider"     VARCHAR(50) NOT NULL,
  "action"       VARCHAR(100) NOT NULL,
  "processed_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "processed_webhooks_payment_id_idx" ON "processed_webhooks" ("payment_id");
