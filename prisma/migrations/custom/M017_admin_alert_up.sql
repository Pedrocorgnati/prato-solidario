-- M017: Cria tabela admin_alerts para alertas de reincidência e denúncias
-- TASK-8 intake-review CL-085

CREATE TABLE "admin_alerts" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "type"       VARCHAR(50) NOT NULL,
  "user_id"    UUID        NOT NULL,
  "message"    TEXT        NOT NULL,
  "read"       BOOLEAN     NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "admin_alerts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_alerts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "IDX_admin_alerts_read"       ON "admin_alerts" ("read");
CREATE INDEX "IDX_admin_alerts_user_id"    ON "admin_alerts" ("user_id");
CREATE INDEX "IDX_admin_alerts_created_at" ON "admin_alerts" ("created_at");
