-- M005 DOWN: Rollback metrics + sponsors + balance tables

DROP TABLE IF EXISTS "processed_webhooks" CASCADE;
DROP TABLE IF EXISTS "mp_connections" CASCADE;
DROP TABLE IF EXISTS "marmitaria_balances" CASCADE;
DROP TABLE IF EXISTS "sponsored_meals" CASCADE;
DROP TABLE IF EXISTS "sponsor_purchases" CASCADE;
DROP TABLE IF EXISTS "impact_metrics" CASCADE;
