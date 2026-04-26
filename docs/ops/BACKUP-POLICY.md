# Politica de Backup — Prato Solidario

**Versao:** 1.0
**Ultima revisao:** 2026-04-21
**Responsavel:** Ops / Founding team

## Provedor e mecanismo

- **Provedor:** Supabase (Postgres gerenciado)
- **Mecanismo primario:** PITR (Point-In-Time Recovery) habilitado no plano Pro
- **Snapshots diarios automaticos** do Supabase
- **Retencao:**
  - Free tier: 7 dias (default)
  - Pro tier: 30 dias (alvo a partir de 2026-05)

## RPO / RTO

| Metrica | Alvo | Observacao |
|---------|------|------------|
| RPO (Recovery Point Objective) | <= 24h | Snapshot diario do Supabase |
| RTO (Recovery Time Objective) | <= 4h | Restore em DB staging + swap DNS |

## Procedimento de restore

1. Acessar dashboard Supabase > Database > Backups
2. Escolher snapshot ou timestamp PITR
3. "Restore to new project" para validar em ambiente isolado
4. Rodar `scripts/verify-backup-restore.sh` para sanidade
5. Atualizar `DATABASE_URL` em Vercel apontando para projeto restaurado
6. Registrar incidente em `docs/ops/INCIDENT-LOG.md`

## Frequencia de dry-run

- **Mensal** via workflow `.github/workflows/backup-verify.yml` (cron `0 3 1 * *`)
- **Manual apos migrations estruturais** (novos models, DROP TABLE, etc.)

## Historico de verificacoes

| Data | Tipo | Resultado | Responsavel |
|------|------|-----------|-------------|
| _pendente 1o dry-run_ | | | |

## Revisao

- Revisar esta politica **trimestralmente** e apos incidentes.
- Owner responsavel por manter data de ultima revisao atualizada.
