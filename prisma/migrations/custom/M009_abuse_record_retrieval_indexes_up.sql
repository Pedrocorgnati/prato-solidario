-- M009: AbuseRecord + índices adicionais em RetrievalCode
-- @see module-9-retirada-publica/TASK-1/ST003 + TASK-3/ST001

-- Novos índices em retrieval_codes
CREATE INDEX IF NOT EXISTS "IDX_retrieval_codes_expires_at"
  ON "retrieval_codes" ("expires_at");

CREATE INDEX IF NOT EXISTS "IDX_retrieval_codes_receptor_status"
  ON "retrieval_codes" ("receptor_id", "status");

-- Modelo AbuseRecord
CREATE TABLE IF NOT EXISTS "abuse_records" (
  "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
  "ip_address"   VARCHAR(45)  NOT NULL,
  "fingerprint"  VARCHAR(64),
  "user_id"      UUID,
  "blocked_until" TIMESTAMPTZ,
  "block_count"  INTEGER      NOT NULL DEFAULT 0,
  "reason"       VARCHAR(255),
  "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "abuse_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_abuse_records_ip"
  ON "abuse_records" ("ip_address");

CREATE INDEX IF NOT EXISTS "IDX_abuse_records_fingerprint"
  ON "abuse_records" ("fingerprint");

CREATE INDEX IF NOT EXISTS "IDX_abuse_records_user_id"
  ON "abuse_records" ("user_id");

CREATE INDEX IF NOT EXISTS "IDX_abuse_records_blocked_until"
  ON "abuse_records" ("blocked_until");
