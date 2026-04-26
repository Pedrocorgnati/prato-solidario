-- M011 DOWN: Reverte MP Connect tokens criptografados + ProcessedWebhook

-- 1. Remove tabela de idempotência
DROP TABLE IF EXISTS "processed_webhooks";

-- 2. Remove índices de MP Connection
DROP INDEX IF EXISTS "mp_connections_expires_at_idx";
DROP INDEX IF EXISTS "mp_connections_status_idx";

-- 3. Restaura colunas legadas (sem dados — rollback apenas estrutural)
ALTER TABLE "mp_connections"
  ADD COLUMN IF NOT EXISTS "access_token" TEXT,
  ADD COLUMN IF NOT EXISTS "refresh_token" TEXT,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Remove colunas novas
ALTER TABLE "mp_connections"
  DROP COLUMN IF EXISTS "access_token_encrypted",
  DROP COLUMN IF EXISTS "refresh_token_encrypted",
  DROP COLUMN IF EXISTS "public_key",
  DROP COLUMN IF EXISTS "live_mode",
  DROP COLUMN IF EXISTS "status";

-- 5. Remove enum
DROP TYPE IF EXISTS "MPConnectionStatus";
