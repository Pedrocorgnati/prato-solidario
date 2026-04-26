-- Intake Review P2+P3 — novos modelos
-- TASK-5/ST001: NotificationPreferences (LGPD granular)
-- TASK-9/ST003: ShareEvent (tracking anonimo Corrente do Bem)
-- TASK-8/ST003: IdempotencyKey (retry seguro em POST /codes)

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    UUID NOT NULL UNIQUE,
  "categories" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_notification_preferences_user"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "share_events" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "channel"      VARCHAR(30) NOT NULL,
  "context"      VARCHAR(60) NOT NULL,
  "anonymous_id" VARCHAR(64),
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_share_events_channel"    ON "share_events"("channel");
CREATE INDEX IF NOT EXISTS "IDX_share_events_created_at" ON "share_events"("created_at");

CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "key"         VARCHAR(80) PRIMARY KEY,
  "response"    JSONB NOT NULL,
  "status_code" INTEGER NOT NULL DEFAULT 200,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_idempotency_keys_expires_at" ON "idempotency_keys"("expires_at");
