-- Rollback: M007 — Remove GiST e índices parciais
-- ATENÇÃO: Remover IDX_addresses_geo desabilita queries de raio PostGIS da Rock-1
-- Executar ANTES do rollback do M006

DROP INDEX CONCURRENTLY IF EXISTS "IDX_addresses_geo";
DROP INDEX CONCURRENTLY IF EXISTS "IDX_users_document";
DROP INDEX CONCURRENTLY IF EXISTS "IDX_users_marmitaria_status";

-- Verificação:
-- SELECT indexname FROM pg_indexes
--   WHERE indexname IN ('IDX_addresses_geo', 'IDX_users_document', 'IDX_users_marmitaria_status');
-- Esperado: 0 linhas
