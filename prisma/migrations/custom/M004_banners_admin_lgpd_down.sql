-- M004 DOWN: Rollback banners + admin + LGPD tables

DROP TABLE IF EXISTS "data_export_requests" CASCADE;
DROP TABLE IF EXISTS "consent_logs" CASCADE;
DROP TABLE IF EXISTS "admin_actions" CASCADE;
DROP TABLE IF EXISTS "banner_credit_histories" CASCADE;
DROP TABLE IF EXISTS "banner_credits" CASCADE;
DROP TABLE IF EXISTS "banner_campaigns" CASCADE;
