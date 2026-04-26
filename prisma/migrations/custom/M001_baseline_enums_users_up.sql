-- M001: Baseline — Enums + Users + Addresses + PushTokens + AuditLogs
-- NOTA: Esta migration foi criada retroativamente para rastreabilidade.
-- Se o banco já existe via Supabase Dashboard / prisma db push, NÃO executar novamente.

-- ─── ENUMS ──────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('DOADOR_PF', 'DOADOR_RESTAURANTE', 'MARMITARIA', 'RECEPTOR', 'ONG', 'PATROCINADOR', 'ADMIN');
CREATE TYPE "DocumentType" AS ENUM ('CPF', 'CNPJ');
CREATE TYPE "MarmitariaStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE');
CREATE TYPE "Platform" AS ENUM ('android', 'ios', 'web');
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'AVAILABLE', 'RESERVED', 'COMPLETED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "DonationType" AS ENUM ('REGULAR', 'SPONSORED');
CREATE TYPE "RetrievalCodeStatus" AS ENUM ('ACTIVE', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "CodeType" AS ENUM ('INDIVIDUAL', 'FAMILY');
CREATE TYPE "BlockLevel" AS ENUM ('NONE', 'ONE_DAY', 'THREE_DAYS', 'PROGRESSIVE');
CREATE TYPE "BannerStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'SCHEDULED', 'COMPLETED', 'REJECTED');
CREATE TYPE "BannerType" AS ENUM ('PAID', 'FREE_RESTAURANT', 'PERMUTA');
CREATE TYPE "BannerPosition" AS ENUM ('TOP', 'SIDEBAR', 'INLINE');
CREATE TYPE "BannerCreditType" AS ENUM ('EARNED', 'USED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('CODE_GENERATED', 'WINDOW_EXPIRING', 'DONATION_NEARBY', 'SPONSOR_CONFIRMATION');
CREATE TYPE "IncidentType" AS ENUM ('ABUSE', 'FRAUD', 'QUALITY', 'NO_SHOW', 'OTHER');
CREATE TYPE "ConsentVersion" AS ENUM ('V1', 'V2');
CREATE TYPE "AdminActionType" AS ENUM ('APPROVE', 'REJECT', 'SUSPEND', 'UNBLOCK', 'WARN', 'DELETE');
CREATE TYPE "MPConnectionStatus" AS ENUM ('CONNECTED', 'NEEDS_RECONNECT', 'DISCONNECTED');
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD');
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
CREATE TYPE "SponsoredMealStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'DELIVERED');
CREATE TYPE "BadgeType" AS ENUM ('PRIMEIRA_DOACAO', 'DOADOR_FREQUENTE', 'HEROI_DO_MES', 'CENTURIAO', 'MESTRE');

-- ─── USERS ──────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "email"              VARCHAR(255) NOT NULL UNIQUE,
  "role"               "UserRole" NOT NULL,
  "name"               VARCHAR(255) NOT NULL,
  "phone"              VARCHAR(20),
  "document"           VARCHAR(14),
  "document_type"      "DocumentType",
  "photo_url"          TEXT,
  "is_redistributor"   BOOLEAN NOT NULL DEFAULT false,
  "marmitaria_status"  "MarmitariaStatus",
  "marmitaria_price"   DECIMAL(10, 2),
  "marmitaria_schedule" JSONB,
  "terms_accepted_at"  TIMESTAMPTZ NOT NULL,
  "privacy_accepted_at" TIMESTAMPTZ NOT NULL,
  "terms_version"      VARCHAR(20) NOT NULL DEFAULT '1.0',
  "email_verified"     BOOLEAN NOT NULL DEFAULT false,
  "is_active"          BOOLEAN NOT NULL DEFAULT true,
  "deleted_at"         TIMESTAMPTZ,
  "anonymized_at"      TIMESTAMPTZ,
  "hall_of_fame"       BOOLEAN NOT NULL DEFAULT false,
  "created_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_users_role" ON "users" ("role");
CREATE INDEX "IDX_users_is_active" ON "users" ("is_active");

-- ─── ADDRESSES ──────────────────────────────────────────────────────────────

CREATE TABLE "addresses" (
  "id"          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"     UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "cep"         CHAR(8) NOT NULL,
  "logradouro"  VARCHAR(255) NOT NULL,
  "numero"      VARCHAR(20) NOT NULL,
  "complemento" VARCHAR(100),
  "bairro"      VARCHAR(100) NOT NULL,
  "cidade"      VARCHAR(100) NOT NULL,
  "estado"      CHAR(2) NOT NULL,
  "lat"         DOUBLE PRECISION,
  "lng"         DOUBLE PRECISION,
  "is_primary"  BOOLEAN NOT NULL DEFAULT true,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_addresses_user_id" ON "addresses" ("user_id");
CREATE INDEX "IDX_addresses_cep" ON "addresses" ("cep");

-- ─── PUSH TOKENS ────────────────────────────────────────────────────────────

CREATE TABLE "push_tokens" (
  "id"         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"    UUID REFERENCES "users" ("id") ON DELETE CASCADE,
  "device_id"  VARCHAR(255) NOT NULL,
  "token"      VARCHAR(255) NOT NULL UNIQUE,
  "platform"   "Platform" NOT NULL,
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_push_tokens_user_id" ON "push_tokens" ("user_id");
CREATE INDEX "IDX_push_tokens_device_id" ON "push_tokens" ("device_id");

-- ─── AUDIT LOGS ─────────────────────────────────────────────────────────────

CREATE TABLE "audit_logs" (
  "id"          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"     UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "action"      VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id"   UUID,
  "metadata"    JSONB,
  "ip_address"  VARCHAR(45),
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id");
CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action");
CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at");
CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id");
