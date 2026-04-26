-- M001 DOWN: Rollback enums + users + addresses + push_tokens + audit_logs

DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "push_tokens" CASCADE;
DROP TABLE IF EXISTS "addresses" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

DROP TYPE IF EXISTS "BadgeType";
DROP TYPE IF EXISTS "SponsoredMealStatus";
DROP TYPE IF EXISTS "PurchaseStatus";
DROP TYPE IF EXISTS "PaymentMethod";
DROP TYPE IF EXISTS "MPConnectionStatus";
DROP TYPE IF EXISTS "AdminActionType";
DROP TYPE IF EXISTS "ConsentVersion";
DROP TYPE IF EXISTS "IncidentType";
DROP TYPE IF EXISTS "NotificationType";
DROP TYPE IF EXISTS "BannerCreditType";
DROP TYPE IF EXISTS "BannerPosition";
DROP TYPE IF EXISTS "BannerType";
DROP TYPE IF EXISTS "BannerStatus";
DROP TYPE IF EXISTS "BlockLevel";
DROP TYPE IF EXISTS "CodeType";
DROP TYPE IF EXISTS "RetrievalCodeStatus";
DROP TYPE IF EXISTS "DonationType";
DROP TYPE IF EXISTS "DonationStatus";
DROP TYPE IF EXISTS "Platform";
DROP TYPE IF EXISTS "MarmitariaStatus";
DROP TYPE IF EXISTS "DocumentType";
DROP TYPE IF EXISTS "UserRole";
