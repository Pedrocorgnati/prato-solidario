-- Migration: M007 — GiST e índices parciais
-- Criado em: 2026-04-04
-- Gerado por: /db-migration-create
-- Depende de: M006 (PostGIS ativo), schema Prisma migrado (tabelas addresses e users criadas)
-- Nota: Executar APÓS "prisma migrate dev" ter criado as tabelas

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Índice GiST geoespacial na tabela addresses
-- Usado para: queries de raio (doações próximas) na Rock-1
-- Tipo: GIST sobre ST_MakePoint(lng, lat)::geography
-- Condicional: somente linhas com lat e lng preenchidos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_addresses_geo"
  ON addresses
  USING GIST (ST_MakePoint(lng, lat)::geography)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Índice parcial em users.document (CPF/CNPJ)
-- Usado para: busca de usuário por documento sem varrer NULLs
-- Condicional: somente linhas onde document não é nulo
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_document"
  ON users (document)
  WHERE document IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Índice parcial em users.marmitaria_status
-- Usado para: fila de aprovação de marmitarias no painel admin (Rock-3)
-- Condicional: somente usuários com role MARMITARIA_PARTNER
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_marmitaria_status"
  ON users (marmitaria_status)
  WHERE role = 'MARMITARIA_PARTNER';

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificação pós-execução:
-- SELECT indexname, indexdef FROM pg_indexes
--   WHERE tablename IN ('addresses', 'users')
--   AND indexname IN ('IDX_addresses_geo', 'IDX_users_document', 'IDX_users_marmitaria_status');
-- Esperado: 3 linhas
-- ─────────────────────────────────────────────────────────────────────────────
