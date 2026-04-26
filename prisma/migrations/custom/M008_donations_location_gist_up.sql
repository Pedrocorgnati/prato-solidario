-- Migration: M008 — Índice GiST em donations.location
-- Criado em: 2026-04-05
-- Gerado por: /auto-flow execute (module-8-doacao-form/TASK-0/ST004)
-- Depende de: M006 (PostGIS ativo), schema Prisma migrado (tabela donations criada)
-- Nota: Executar APÓS "prisma migrate dev" ter criado a tabela donations

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Índice GiST geoespacial na coluna donations.location
-- Tipo: geography(Point, 4326) — usa projeção esférica (cálculos em metros)
-- Usado para: queries ST_DWithin (findAvailableNear, notifyNearbyRecipients)
-- CONCURRENTLY: não bloqueia escritas durante criação
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_donations_location_gist"
  ON donations
  USING GIST (location)
  WHERE location IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificação pós-execução:
-- SELECT indexname, indexdef FROM pg_indexes
--   WHERE tablename = 'donations'
--   AND indexname = 'IDX_donations_location_gist';
-- Esperado: 1 linha com indexdef contendo "USING gist (location)"
-- ─────────────────────────────────────────────────────────────────────────────
