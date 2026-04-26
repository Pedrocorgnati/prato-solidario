# Runbook — Alertas Operacionais

## MP Webhook Failure

**Alerta:** Sentry > tag `webhook=mercadopago` + level `error|critical` — 1 evento em 5min.
**SLA resposta:** 1h.

### Quando dispara

- Assinatura HMAC invalida
- Falha ao processar pagamento (DB transaction, MP API fetch)
- Exception nao tratada em `processPaymentWebhook`

### Primeiros passos

1. Abrir Sentry > Issues > filtrar por tag `webhook:mercadopago`
2. Identificar `paymentId` no payload extra
3. Consultar MP Dashboard > Pagamentos com o `paymentId` para confirmar status real
4. Verificar tabela `processed_webhooks` — se nao tem registro, webhook nao rodou ate o fim

### Replay manual

- Endpoint interno `/api/v1/webhooks/mercadopago/replay/:paymentId` (se implementado)
- Caso contrario: SQL manual para reconciliar `SponsorPurchase.status` e `MarmitariaBalance` consultando MP

### Escalation

- **1h sem resolucao:** chamar founding team (telefone em `docs/ops/CONTACTS.md`)
- **Incidente com impacto financeiro confirmado:** contato MP suporte empresarial

### Prevencao / pos-mortem

- Incidentes repetidos (>3 em 7d) exigem pos-mortem em `docs/ops/POSTMORTEMS/`.

---

## Backup verification failure

**Alerta:** workflow `backup-verify.yml` falha.

### Passos

1. Verificar snapshot mais recente no dashboard Supabase
2. Rodar `scripts/verify-backup-restore.sh` localmente com credenciais staging
3. Se persistir: abrir ticket Supabase + notificar ops
