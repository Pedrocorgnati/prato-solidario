-- Migration: M010 — Rollback grace_until
DROP INDEX IF EXISTS IDX_retrieval_codes_grace_until;
ALTER TABLE retrieval_codes DROP COLUMN IF EXISTS grace_until;
