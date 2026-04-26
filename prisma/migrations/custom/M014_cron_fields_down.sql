-- M014: Rollback warning_sent_at and anonymized_at

DROP INDEX IF EXISTS IDX_retrieval_codes_warning_sent_at;
ALTER TABLE retrieval_codes DROP COLUMN IF EXISTS warning_sent_at;

DROP INDEX IF EXISTS IDX_users_anonymized_at;
ALTER TABLE users DROP COLUMN IF EXISTS anonymized_at;
