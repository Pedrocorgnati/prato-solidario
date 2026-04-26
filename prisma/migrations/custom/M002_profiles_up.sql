-- M002: Profile tables (6 perfis de papel)
-- NOTA: Migration retroativa para rastreabilidade.

CREATE TABLE "donor_profiles" (
  "id"              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"         UUID NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
  "preferred_times" JSONB,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "restaurant_profiles" (
  "id"               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"          UUID NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
  "trade_name"       VARCHAR(255) NOT NULL,
  "cnpj"             VARCHAR(14) NOT NULL UNIQUE,
  "average_portions" INTEGER,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "receptor_profiles" (
  "id"             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"        UUID NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
  "family_size"    INTEGER,
  "block_level"    "BlockLevel" NOT NULL DEFAULT 'NONE',
  "blocked_until"  TIMESTAMPTZ,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "ong_profiles" (
  "id"              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"         UUID NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
  "cnpj"            VARCHAR(14) NOT NULL UNIQUE,
  "registration_no" VARCHAR(50),
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "marmitaria_profiles" (
  "id"             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"        UUID NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
  "trade_name"     VARCHAR(255) NOT NULL,
  "cnpj"           VARCHAR(14) NOT NULL UNIQUE,
  "status"         "MarmitariaStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "price_per_meal" DECIMAL(10, 2),
  "schedule"       JSONB,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_marmitaria_profiles_status" ON "marmitaria_profiles" ("status");

CREATE TABLE "sponsor_profiles" (
  "id"           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"      UUID NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
  "company_name" VARCHAR(255),
  "cnpj"         VARCHAR(14) UNIQUE,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
