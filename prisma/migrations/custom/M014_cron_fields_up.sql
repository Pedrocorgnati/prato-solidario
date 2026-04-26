-- M014: Add warning_sent_at to retrieval_codes and anonymized_at to users
-- Required by module-23-crons-jobs for cron idempotency

-- retrieval_codes: track when expiration warning was sent (expire-warning cron idempotency)
ALTER TABLE retrieval_codes
  ADD COLUMN IF NOT EXISTS warning_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS IDX_retrieval_codes_warning_sent_at
  ON retrieval_codes (warning_sent_at)
  WHERE warning_sent_at IS NULL;

-- users: track when LGPD anonymization was applied (lgpd-cleanup cron idempotency)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS IDX_users_anonymized_at
  ON users (anonymized_at)
  WHERE anonymized_at IS NULL;
