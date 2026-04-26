-- M004: Banners + AdminActions + ConsentLog + DataExportRequest
-- NOTA: Migration retroativa para rastreabilidade.

CREATE TABLE "banner_campaigns" (
  "id"                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "title"               VARCHAR(255) NOT NULL,
  "type"                "BannerType" NOT NULL DEFAULT 'PAID',
  "advertiser_id"       UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "image_url"           TEXT NOT NULL,
  "link_url"            TEXT,
  "position"            "BannerPosition" NOT NULL DEFAULT 'TOP',
  "status"              "BannerStatus" NOT NULL DEFAULT 'DRAFT',
  "priority"            INTEGER NOT NULL DEFAULT 100,
  "permuta_partner_url" TEXT,
  "internal_note"       TEXT,
  "start_date"          TIMESTAMPTZ,
  "end_date"            TIMESTAMPTZ,
  "impressions"         INTEGER NOT NULL DEFAULT 0,
  "clicks"              INTEGER NOT NULL DEFAULT 0,
  "deleted_at"          TIMESTAMPTZ,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_banner_campaigns_status" ON "banner_campaigns" ("status");
CREATE INDEX "IDX_banner_campaigns_type" ON "banner_campaigns" ("type");
CREATE INDEX "IDX_banner_campaigns_position_status" ON "banner_campaigns" ("position", "status");

CREATE TABLE "banner_credits" (
  "id"              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "restaurant_id"   UUID NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
  "days_available"  INTEGER NOT NULL DEFAULT 0,
  "days_used"       INTEGER NOT NULL DEFAULT 0,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "banner_credit_histories" (
  "id"          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "credit_id"   UUID NOT NULL REFERENCES "banner_credits" ("id") ON DELETE CASCADE,
  "type"        "BannerCreditType" NOT NULL,
  "days"        INTEGER NOT NULL,
  "donation_id" UUID,
  "campaign_id" UUID REFERENCES "banner_campaigns" ("id") ON DELETE SET NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_banner_credit_history_credit_id" ON "banner_credit_histories" ("credit_id");
CREATE INDEX "IDX_banner_credit_history_donation_id" ON "banner_credit_histories" ("donation_id");

CREATE TABLE "admin_actions" (
  "id"         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "admin_id"   UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "target_id"  UUID NOT NULL,
  "action"     "AdminActionType" NOT NULL,
  "reason"     TEXT,
  "metadata"   JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_admin_actions_admin_id" ON "admin_actions" ("admin_id");
CREATE INDEX "IDX_admin_actions_target_id" ON "admin_actions" ("target_id");

CREATE TABLE "consent_logs" (
  "id"          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"     UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "version"     "ConsentVersion" NOT NULL,
  "ip_address"  VARCHAR(45),
  "user_agent"  TEXT,
  "accepted_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "IDX_consent_logs_user_id" ON "consent_logs" ("user_id");

CREATE TABLE "data_export_requests" (
  "id"           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"      UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "status"       VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "file_url"     TEXT,
  "requested_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMPTZ
);

CREATE INDEX "IDX_data_export_requests_user_id" ON "data_export_requests" ("user_id");
