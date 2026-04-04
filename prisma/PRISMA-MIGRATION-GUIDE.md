---
template: migration-guide
version-from: "0.0.0"
version-to: "1.0.0-skeleton"
breaking: false
tipo: schema
data-planejada: 2026-04-04
janela-de-manutencao: "qualquer"
tempo-estimado: 15
rollback-possivel: true
autor: Pedro Corgnati
aprovado-por: /db-migration-create
---

# Guia de Migração: Skeleton v1.0 — Prato Solidário

> **Tipo:** Schema (criação inicial)
> **Breaking changes:** Não (banco novo, sem dados)
> **Downtime necessário:** Não (banco vazio)
> **Irreversível após:** Nunca (sem dados, qualquer etapa é reversível)

---

## 1. Resumo das Mudanças

### O que muda

Esta migration cria o schema inicial do Prato Solidário (skeleton):

- **4 tabelas:** `users`, `addresses`, `push_tokens`, `audit_logs`
- **12 tipos ENUM:** `user_role`, `document_type`, `marmitaria_status`, `platform` + 8 enums pré-definidos para as rocks
- **Extensão PostGIS** para queries geoespaciais (raio de doações, mapa de calor)
- **Índices customizados:** GiST geoespacial em `addresses.lat/lng`, índices parciais em `users`

### Por que essa migração é necessária

É o ponto de partida do sistema. Sem ela, nenhum usuário pode ser cadastrado, autenticado ou ter endereço registrado.

---

## 2. Breaking Changes

Nenhum — banco recém-criado (sem dados).

---

## 3. Pré-Requisitos

### Infraestrutura
- [ ] Projeto Supabase criado e acessível
- [ ] `DATABASE_URL` obtida do painel Supabase → Settings → Database → Connection string → URI
  - Formato: `postgresql://postgres.[ref]:[password]@[host]:5432/postgres`
  - Para uso local com pooling: usar a Connection Pooler URL (porta 6543)
- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas: `npm install` no `workspace_root`

### Supabase — PostGIS
- [ ] Confirmar que a extensão PostGIS está disponível no seu plano Supabase
  - Free tier: PostGIS disponível por padrão ✓
  - Verificar: Supabase Dashboard → Database → Extensions → buscar "postgis"

### Acesso
- [ ] Acesso ao Supabase SQL Editor (para M006 e M007)
- [ ] `.env` local criado com `DATABASE_URL` correto

---

## 4. Variáveis de Ambiente

Criar `.env` em `output/workspace/prato-solidario/`:

```bash
# Supabase — obter em: Project Settings → Database → Connection String
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres"

# Para Prisma Client (runtime) — use o pooler para produção:
# DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Auth (necessário para back-end)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"
```

---

## 5. Passos de Migração

> Execute na ordem exata. Verificar critério de sucesso antes de avançar.

---

### Passo 1: Habilitar PostGIS (M006)

**Onde executar:** Supabase Dashboard → SQL Editor

```sql
-- Cole o conteúdo de: prisma/migrations/custom/M006_enable_postgis_up.sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

**Critério de sucesso:**
```sql
SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'postgis%';
-- Esperado: 2 linhas
```

**Rollback:** `DROP EXTENSION IF EXISTS postgis_topology CASCADE; DROP EXTENSION IF EXISTS postgis CASCADE;`

---

### Passo 2: Gerar e aplicar migration Prisma (M001–M005)

**Onde executar:** terminal no `workspace_root`

```bash
cd output/workspace/prato-solidario

# Gerar e aplicar migration inicial (cria todas as tabelas e enums)
npx prisma migrate dev --name skeleton-init

# O Prisma irá:
# 1. Ler o schema.prisma
# 2. Gerar SQL em: prisma/migrations/{timestamp}_skeleton-init/migration.sql
# 3. Aplicar no banco conectado via DATABASE_URL
# 4. Atualizar a tabela _prisma_migrations
```

**Critério de sucesso:**
```bash
# Verificar que as tabelas foram criadas
npx prisma db pull --print | grep "model "
# Esperado: model User, model Address, model PushToken, model AuditLog
```

Ou via Supabase Dashboard → Table Editor → verificar as 4 tabelas.

**Rollback:**
```bash
# Reverter a migration mais recente (DESTRÓI dados — ok em banco vazio)
npx prisma migrate reset --force
```

---

### Passo 3: Aplicar índices customizados (M007)

**Onde executar:** Supabase Dashboard → SQL Editor

> Executar APÓS o Passo 2 (tabelas já criadas).

```sql
-- Cole o conteúdo de: prisma/migrations/custom/M007_geo_partial_indexes_up.sql

-- Índice GiST geoespacial (PostGIS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_addresses_geo"
  ON addresses
  USING GIST (ST_MakePoint(lng, lat)::geography)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Índice parcial: busca por CPF/CNPJ
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_document"
  ON users (document)
  WHERE document IS NOT NULL;

-- Índice parcial: fila de aprovação de marmitarias
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_marmitaria_status"
  ON users (marmitaria_status)
  WHERE role = 'MARMITARIA_PARTNER';
```

**Critério de sucesso:**
```sql
SELECT indexname FROM pg_indexes
  WHERE indexname IN ('IDX_addresses_geo', 'IDX_users_document', 'IDX_users_marmitaria_status');
-- Esperado: 3 linhas
```

**Rollback:**
```sql
DROP INDEX CONCURRENTLY IF EXISTS "IDX_addresses_geo";
DROP INDEX CONCURRENTLY IF EXISTS "IDX_users_document";
DROP INDEX CONCURRENTLY IF EXISTS "IDX_users_marmitaria_status";
```

---

### Passo 4: Gerar Prisma Client

```bash
cd output/workspace/prato-solidario
npx prisma generate
```

**Critério de sucesso:** sem erros. O client será gerado em `node_modules/@prisma/client`.

---

## 6. Validação Pós-Migração

```sql
-- 1. Verificar tabelas criadas
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Esperado: addresses, audit_logs, push_tokens, users

-- 2. Verificar enums criados
SELECT typname FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;
-- Esperado: 12 enums (banner_status, block_level, code_status, code_type,
--   document_type, donation_status, donation_type, incident_type,
--   marmitaria_status, notification_type, platform, user_role)

-- 3. Verificar extensões PostGIS
SELECT extname FROM pg_extension WHERE extname LIKE 'postgis%';
-- Esperado: 2 linhas

-- 4. Verificar todos os índices
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
-- Deve incluir: IDX_addresses_geo, IDX_users_document, IDX_users_marmitaria_status

-- 5. Verificar FK de integridade
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu USING (constraint_schema, constraint_name)
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
-- Esperado: 5 FKs (addresses→users, push_tokens→users, audit_logs→users)
```

---

## 7. Rollback Completo

Como o banco está vazio, o rollback é simples:

```bash
# Opção 1: Reset completo via Prisma (recomendado)
cd output/workspace/prato-solidario
npx prisma migrate reset --force
# Remove todas as tabelas, enums e dados. Mantém as extensões.

# Opção 2: Supabase Dashboard → Database → Reset Database (botão)
# Remove TUDO incluindo extensões.
```

---

## 8. Migrations Futuras por Rock

> Cada rock adicionará modelos ao schema.prisma. Executar `/db-migration-create` após cada rock.

| Rock | Modelos a adicionar | Enums a atualizar |
|------|--------------------|--------------------|
| Rock-1 (core-doacao) | Donation, RetrievalCode, DonorProfile, ReceptorBlock, DonorIncident | DonationStatus (+DRAFT, PARTIALLY_CLAIMED), DonationType (+URGENT), CodeStatus (+DONOR_ABSENT, CANCELLED), BlockLevel (renomear valores), NotificationType (novos valores), IdentifierType (novo) |
| Rock-2 (marmitarias) | MarmitariaPartner, SponsoredMeal, SponsorPurchase, MercadoPagoToken, WebhookLog | — |
| Rock-3 (admin-banners) | Banner, BannerCampaign, BannerCredit, BannerCreditHistory, AdminIncident, AdminAction | — |
| Rock-4 (engajamento) | ImpactMetrics, DonorBadge, DonorDiploma, HeatMapData, HallOfFameEntry | — |

> **Atenção enums Rock-1:** Os enums do skeleton (BlockLevel, IncidentType, NotificationType) têm valores diferentes dos definidos no FDD core-doacao. Como o banco estará vazio até a Rock-1 ser implementada, as mudanças de valor podem ser feitas via `ALTER TYPE` sem migração de dados.

---

## 9. Checklist Final

### Antes de começar
- [ ] `DATABASE_URL` configurado no `.env`
- [ ] PostGIS disponível no Supabase (verificar Extensions)
- [ ] `npm install` executado no workspace_root

### Pós-migração
- [ ] 4 tabelas criadas (users, addresses, push_tokens, audit_logs)
- [ ] 12 enums criados
- [ ] 3 índices customizados criados (IDX_addresses_geo, IDX_users_document, IDX_users_marmitaria_status)
- [ ] PostGIS ativo (2 extensões)
- [ ] `npx prisma generate` executado sem erros
- [ ] `npx prisma studio` abre sem erros (opcional — para inspecionar visualmente)

---

## 10. Histórico

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-04-04 | 1.0 | Criação (skeleton init) | /db-migration-create |
