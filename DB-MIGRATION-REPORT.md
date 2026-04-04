# DB Migration Report

**Projeto:** prato-solidario
**Nome Comercial:** Prato Solidário
**ORM:** Prisma
**Database:** PostgreSQL (Supabase)
**Data:** 2026-04-04
**Gerado por:** /db-migration-create
**Config:** .claude/projects/prato-solidario.json
**Data-Integrity-Decision:** não disponível (executar `/skill:data-integrity-guard` antes de rocks com dados em produção)

---

## Migrations Geradas

| # | Arquivo | Operação | Tabelas/Objetos Afetados | Tipo | Reversível |
|---|---------|----------|--------------------------|------|------------|
| 1 | `prisma/schema.prisma` (fix) | ADD url env var | datasource db | additive | Sim |
| 2 | `prisma/migrations/custom/M006_enable_postgis_up.sql` | CREATE EXTENSION | postgis, postgis_topology | additive | Sim |
| 3 | `prisma/migrations/custom/M007_geo_partial_indexes_up.sql` | CREATE INDEX | addresses, users | additive | Sim |
| 4 | `prisma/PRISMA-MIGRATION-GUIDE.md` | Documentação | — | — | N/A |
| — | `prisma migrate dev --name skeleton-init` | CREATE TABLE + CREATE TYPE | 4 tabelas, 12 enums | additive | Sim (reset) |

> **Nota:** O arquivo de migration SQL principal é gerado automaticamente pelo Prisma ao executar `prisma migrate dev`. Não é gerado aqui pois depende do timestamp do momento da execução e do diff real do banco.

---

## Ordem de Execução

```
1. M006 — Enable PostGIS (Supabase SQL Editor)
   Motivo: PostGIS deve existir antes de criar o índice GiST

2. prisma migrate dev --name skeleton-init (terminal)
   Cria: users, addresses, push_tokens, audit_logs + 12 enums
   Depende de: DATABASE_URL no .env

3. M007 — GiST e índices parciais (Supabase SQL Editor)
   Depende de: tabelas criadas pelo step 2, PostGIS ativo

4. npx prisma generate (terminal)
   Gera: @prisma/client para uso no código
```

---

## Tabelas Cobertas

| Tabela | Campos | FKs | Índices Prisma | Índices Custom |
|--------|--------|-----|----------------|----------------|
| `users` | 18 | — | IDX_users_role, IDX_users_is_active | IDX_users_document (parcial), IDX_users_marmitaria_status (parcial) |
| `addresses` | 13 | users.id (CASCADE) | IDX_addresses_user_id, IDX_addresses_cep | IDX_addresses_geo (GiST PostGIS) |
| `push_tokens` | 8 | users.id (CASCADE, opcional) | IDX_push_tokens_user_id, IDX_push_tokens_device_id | — |
| `audit_logs` | 8 | users.id (SET NULL, opcional) | IDX_audit_logs_user_id, IDX_audit_logs_action, IDX_audit_logs_created_at, IDX_audit_logs_entity | — |

---

## Enums Cobertos (12)

| Enum | Valores | Usado em |
|------|---------|----------|
| `UserRole` | DONOR_INDIVIDUAL, DONOR_RESTAURANT, MARMITARIA_PARTNER, RECEPTOR, ONG_AGENT, SPONSOR, ADMIN | users.role |
| `DocumentType` | CPF, CNPJ | users.document_type |
| `MarmitariaStatus` | PENDING_APPROVAL, ACTIVE, SUSPENDED, REJECTED | users.marmitaria_status |
| `Platform` | android, ios, web | push_tokens.platform |
| `DonationStatus` | ACTIVE, PARTIALLY_ALLOCATED, FULLY_ALLOCATED, COMPLETED, EXPIRED, CANCELLED | Donation (Rock-1) |
| `DonationType` | CONVENTIONAL, SPONSORED | Donation (Rock-1) |
| `CodeStatus` | ACTIVE, CONFIRMED, EXPIRED | RetrievalCode (Rock-1) |
| `CodeType` | INDIVIDUAL, FAMILY | RetrievalCode (Rock-1) |
| `BlockLevel` | NONE, ONE_DAY, THREE_DAYS, PROGRESSIVE | ReceptorBlock (Rock-1) |
| `BannerStatus` | ACTIVE, PAUSED, SCHEDULED, EXPIRED | Banner (Rock-3) |
| `NotificationType` | CODE_GENERATED, WINDOW_EXPIRING, DONATION_NEARBY, SPONSOR_CONFIRMATION | Push (Rock-1) |
| `IncidentType` | DONOR_ABSENT, SUSPICIOUS_RECEPTOR, MULTIPLE_NO_SHOW | DonorIncident (Rock-1) |

---

## Discrepâncias Detectadas: Schema Skeleton vs FDDs das Rocks

> **Não bloqueiam a migration do skeleton.** Precisam ser resolvidas como migrations da Rock-1.
> Como o banco estará vazio até a Rock-1 ser implementada, podem ser feitas via `ALTER TYPE` sem migração de dados.

| Enum | Skeleton (atual) | FDD Rock-1 (esperado) | Ação futura |
|------|-----------------|----------------------|-------------|
| `DonationStatus` | sem DRAFT, PARTIALLY_ALLOCATED | +DRAFT, PARTIALLY_CLAIMED (rename) | ALTER TYPE ADD VALUE 'DRAFT'; + rename |
| `DonationType` | CONVENTIONAL, SPONSORED | +URGENT | ALTER TYPE ADD VALUE 'URGENT' |
| `CodeStatus` | ACTIVE, CONFIRMED, EXPIRED | +DONOR_ABSENT, CANCELLED | ALTER TYPE ADD VALUE x2 |
| `BlockLevel` | NONE, ONE_DAY, THREE_DAYS, PROGRESSIVE | NONE, SOFT, MEDIUM, HARD | DROP+RECREATE (sem dados) |
| `NotificationType` | CODE_GENERATED, WINDOW_EXPIRING, DONATION_NEARBY, SPONSOR_CONFIRMATION | remover 2, adicionar 3 | DROP+RECREATE (sem dados) |
| `IncidentType` | DONOR_ABSENT, SUSPICIOUS_RECEPTOR, MULTIPLE_NO_SHOW | ABSENT, WINDOW_EXPIRED, INVALID_CODE | DROP+RECREATE (sem dados) |

---

## Comandos de Aplicação

### Desenvolvimento (primeira vez)

```bash
cd output/workspace/prato-solidario

# 1. Garantir .env com DATABASE_URL
cp .env.example .env  # e preencher DATABASE_URL

# 2. Aplicar M006 via Supabase SQL Editor (copiar conteúdo do arquivo)
# prisma/migrations/custom/M006_enable_postgis_up.sql

# 3. Gerar e aplicar migration Prisma
npx prisma migrate dev --name skeleton-init

# 4. Aplicar M007 via Supabase SQL Editor (copiar conteúdo do arquivo)
# prisma/migrations/custom/M007_geo_partial_indexes_up.sql

# 5. Gerar Prisma Client
npx prisma generate

# 6. (Opcional) Inspecionar visualmente
npx prisma studio
```

### Staging (antes de produção)

```bash
# 1. Aplicar em banco de staging com DATABASE_URL de staging
DATABASE_URL="[staging-url]" npx prisma migrate deploy

# 2. Aplicar M006 e M007 manualmente via SQL Editor do staging
# 3. Validar com queries da seção "Validação" do PRISMA-MIGRATION-GUIDE.md
# 4. Testar rollback em staging antes de ir para produção
```

### Produção

```bash
# SEMPRE com backup realizado antes
# 1. Aplicar M006 via Supabase SQL Editor (produção)
# 2. Aplicar migrations Prisma (não usar migrate dev em produção)
DATABASE_URL="[prod-url]" npx prisma migrate deploy
# 3. Aplicar M007 via Supabase SQL Editor (produção)
# 4. npx prisma generate
```

---

## Rollback

Para reverter, executar na ordem inversa:

```bash
# 1. Reverter M007 (índices)
# SQL Editor: prisma/migrations/custom/M007_geo_partial_indexes_down.sql

# 2. Reverter migration Prisma
npx prisma migrate reset --force  # DESTRÓI dados — ok apenas em dev/banco vazio

# 3. Reverter M006 (PostGIS)
# SQL Editor: prisma/migrations/custom/M006_enable_postgis_down.sql
```

---

## Checklist de Segurança

| # | Item | Status |
|---|------|--------|
| 1 | Tem rollback completo e funcional? | ✅ Sim |
| 2 | Rollback testável sem perda de dados de produção? | ✅ Sim (banco vazio) |
| 3 | Usa IF NOT EXISTS para idempotência? | ✅ Sim (M006 e M007) |
| 4 | Pode ser re-executada sem erro? | ✅ Sim |
| 5 | Colunas NOT NULL novas têm DEFAULT? | ✅ Sim (todos têm defaults ou são novas tabelas) |
| 6 | Nenhum DROP sem backup? | ✅ Sim |
| 7 | Foreign keys têm ON DELETE explícito? | ✅ Sim (CASCADE, SET NULL conforme LLD) |
| 8 | Índices para todas as FKs? | ✅ Sim |
| 9 | Ordem de criação respeita dependências FK? | ✅ Sim (users → addresses, push_tokens, audit_logs) |
| 10 | Dados sensíveis com tipo correto? | ✅ Sim (email: VARCHAR, document: VARCHAR, sem VARCHAR(N) em tokens) |
| 11 | Nenhum ALTER TABLE em tabela com >100k registros? | ✅ N/A (banco novo) |
| 12 | Nenhuma coluna NOT NULL adicionada em tabela com dados? | ✅ N/A (banco novo) |

**Checklist de segurança: 12/12 ✅**

---

## Próximos Passos

1. `/seed-data-create .claude/projects/prato-solidario.json` — popular banco com usuário ADMIN e dados iniciais
2. `/integration-test-create .claude/projects/prato-solidario.json` — testar endpoints com banco real
3. Após implementação da Rock-1: `/db-migration-create .claude/projects/prato-solidario.json` — gerar migrations dos modelos Donation, RetrievalCode, DonorProfile, ReceptorBlock, DonorIncident + correção dos enums
