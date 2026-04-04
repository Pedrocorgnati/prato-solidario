-- Rollback: M006 — Disable PostGIS
-- ATENÇÃO: Usar CASCADE remove todos os objetos dependentes do PostGIS.
-- Executar somente se M007 (índice GiST) já tiver sido revertido.

-- Verificar dependentes antes de remover:
-- SELECT classid, objid, deptype FROM pg_depend WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'postgis');

DROP EXTENSION IF EXISTS postgis_topology CASCADE;
DROP EXTENSION IF EXISTS postgis CASCADE;
