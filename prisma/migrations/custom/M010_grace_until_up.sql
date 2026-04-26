-- Migration: M010 — Add grace_until to retrieval_codes
-- Criado em: 2026-04-05
-- Gerado por: module-10-codigos-historico/TASK-0
-- Motivo: Suporte a grace period de 30min para doador ausente (INT-075)

ALTER TABLE retrieval_codes
  ADD COLUMN IF NOT EXISTS grace_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS IDX_retrieval_codes_grace_until
  ON retrieval_codes (grace_until)
  WHERE grace_until IS NOT NULL;
