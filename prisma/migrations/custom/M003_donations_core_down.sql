-- M003 DOWN: Rollback donations core

DROP TABLE IF EXISTS "abuse_records" CASCADE;
DROP TABLE IF EXISTS "retrieval_codes" CASCADE;
DROP TABLE IF EXISTS "donations" CASCADE;
