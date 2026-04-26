#!/usr/bin/env bash
# verify-backup-restore.sh — dry-run mensal de restore de backup.
# @see docs/ops/BACKUP-POLICY.md
#
# Uso: STAGING_DATABASE_URL=postgres://... ./scripts/verify-backup-restore.sh
#
# Este script assume que o snapshot mais recente ja foi restaurado em um
# database staging (manual via dashboard Supabase ou via API). Ele apenas
# verifica sanidade.

set -euo pipefail

if [[ -z "${STAGING_DATABASE_URL:-}" ]]; then
  echo "ERRO: STAGING_DATABASE_URL nao definido" >&2
  exit 1
fi

echo "[backup-verify] Conectando ao staging..."
USER_COUNT=$(psql "$STAGING_DATABASE_URL" -tAc "SELECT COUNT(*) FROM users;")
echo "[backup-verify] users: $USER_COUNT"

DONATION_COUNT=$(psql "$STAGING_DATABASE_URL" -tAc "SELECT COUNT(*) FROM donations;")
echo "[backup-verify] donations: $DONATION_COUNT"

LATEST_USER_AT=$(psql "$STAGING_DATABASE_URL" -tAc "SELECT MAX(created_at) FROM users;")
echo "[backup-verify] latest user created_at: $LATEST_USER_AT"

if [[ "$USER_COUNT" -lt 1 ]]; then
  echo "ERRO: staging vazio — restore falhou?" >&2
  exit 2
fi

echo "[backup-verify] OK — $(date -u +%FT%TZ)"
