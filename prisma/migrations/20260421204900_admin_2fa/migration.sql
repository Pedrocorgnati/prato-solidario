-- CreateTable
CREATE TABLE "admin_two_factor" (
  "id"                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           UUID        NOT NULL UNIQUE,
  "secret"            VARCHAR(64) NOT NULL,
  "enrolled_at"       TIMESTAMPTZ,
  "backup_codes_hash" TEXT[]      NOT NULL DEFAULT '{}',
  "last_used_step"    BIGINT,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
