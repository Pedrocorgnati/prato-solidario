-- M009 rollback
DROP TABLE IF EXISTS "abuse_records";
DROP INDEX IF EXISTS "IDX_retrieval_codes_expires_at";
DROP INDEX IF EXISTS "IDX_retrieval_codes_receptor_status";
