-- M011: MP Connect — tokens criptografados, status enum, ProcessedWebhook
-- Executar APÓS M010

-- 1. Enum MPConnectionStatus
CREATE TYPE "MPConnectionStatus" AS ENUM ('CONNECTED', 'NEEDS_RECONNECT', 'DISCONNECTED');

-- 2. Adiciona colunas de tokens criptografados e status na tabela existente
ALTER TABLE "mp_connections"
  ADD COLUMN IF NOT EXISTS "access_token_encrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "refresh_token_encrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "public_key" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "live_mode" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "status" "MPConnectionStatus" NOT NULL DEFAULT 'CONNECTED';

-- 3. Migra dados existentes: marca como NEEDS_RECONNECT se isActive=false, CONNECTED se true
-- (campo legado is_active é removido após migração)
UPDATE "mp_connections"
SET "status" = CASE
  WHEN "is_active" = TRUE THEN 'CONNECTED'::"MPConnectionStatus"
  ELSE 'NEEDS_RECONNECT'::"MPConnectionStatus"
END;

-- 4. Remove colunas legadas de texto plano (segurança: nunca devem estar em prod)
-- ATENÇÃO: execute apenas se não houver dados em produção que precisem ser migrados
ALTER TABLE "mp_connections"
  DROP COLUMN IF EXISTS "access_token",
  DROP COLUMN IF EXISTS "refresh_token",
  DROP COLUMN IF EXISTS "is_active";

-- 5. Índices de performance
CREATE INDEX IF NOT EXISTS "mp_connections_expires_at_idx" ON "mp_connections" ("expires_at");
CREATE INDEX IF NOT EXISTS "mp_connections_status_idx" ON "mp_connections" ("status");

-- 6. Cria tabela de idempotência de webhooks
CREATE TABLE IF NOT EXISTS "processed_webhooks" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "payment_id"   VARCHAR(255) NOT NULL,
  "provider"     VARCHAR(50)  NOT NULL,
  "action"       VARCHAR(100) NOT NULL,
  "processed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "processed_webhooks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "processed_webhooks_payment_id_key" UNIQUE ("payment_id")
);

CREATE INDEX IF NOT EXISTS "processed_webhooks_payment_id_idx" ON "processed_webhooks" ("payment_id");
