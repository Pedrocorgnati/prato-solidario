-- M003: Donations + RetrievalCodes + AbuseRecords (core de doação)
-- NOTA: Migration retroativa para rastreabilidade.
-- O campo `location` (geography) depende de PostGIS habilitado em M006.

CREATE TABLE "donations" (
  "id"                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "donor_id"            UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "type"                "DonationType" NOT NULL DEFAULT 'REGULAR',
  "status"              "DonationStatus" NOT NULL DEFAULT 'PENDING',
  "description"         TEXT NOT NULL,
  "portions"            INTEGER NOT NULL,
  "remaining_portions"  INTEGER NOT NULL DEFAULT 0,
  "location"            geography(Point, 4326),
  "radius_km"           DOUBLE PRECISION NOT NULL DEFAULT 5,
  "window_start"        TIMESTAMPTZ NOT NULL,
  "window_end"          TIMESTAMPTZ NOT NULL,
  "photo_url"           TEXT,
  "deleted_at"          TIMESTAMPTZ,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_donations_status" ON "donations" ("status");
CREATE INDEX "IDX_donations_donor_id" ON "donations" ("donor_id");
CREATE INDEX "IDX_donations_window_end" ON "donations" ("window_end");

CREATE TABLE "retrieval_codes" (
  "id"              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "donation_id"     UUID NOT NULL REFERENCES "donations" ("id") ON DELETE CASCADE,
  "receptor_id"     UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "code"            VARCHAR(20) NOT NULL UNIQUE,
  "type"            "CodeType" NOT NULL DEFAULT 'INDIVIDUAL',
  "status"          "RetrievalCodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "portions"        INTEGER NOT NULL DEFAULT 1,
  "confirmed_at"    TIMESTAMPTZ,
  "expires_at"      TIMESTAMPTZ NOT NULL,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_retrieval_codes_donation_id" ON "retrieval_codes" ("donation_id");
CREATE INDEX "IDX_retrieval_codes_status" ON "retrieval_codes" ("status");
CREATE INDEX "IDX_retrieval_codes_code" ON "retrieval_codes" ("code");
CREATE INDEX "IDX_retrieval_codes_expires_at" ON "retrieval_codes" ("expires_at");
CREATE INDEX "IDX_retrieval_codes_receptor_status" ON "retrieval_codes" ("receptor_id", "status");

CREATE TABLE "abuse_records" (
  "id"            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "ip_address"    VARCHAR(45) NOT NULL,
  "fingerprint"   VARCHAR(64),
  "user_id"       UUID,
  "blocked_until" TIMESTAMPTZ,
  "block_count"   INTEGER NOT NULL DEFAULT 0,
  "reason"        VARCHAR(255),
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_abuse_records_ip" ON "abuse_records" ("ip_address");
CREATE INDEX "IDX_abuse_records_fingerprint" ON "abuse_records" ("fingerprint");
CREATE INDEX "IDX_abuse_records_user_id" ON "abuse_records" ("user_id");
CREATE INDEX "IDX_abuse_records_blocked_until" ON "abuse_records" ("blocked_until");
