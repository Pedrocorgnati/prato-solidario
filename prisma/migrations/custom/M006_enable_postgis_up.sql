-- Migration: M006 — Enable PostGIS
-- Criado em: 2026-04-04
-- Gerado por: /db-migration-create
-- Motivo: Suporte a queries geoespaciais (raio de doações, mapa de calor) via PostGIS
-- Nota: Executar ANTES de prisma migrate dev OU logo após (sem tabelas ainda)

-- Habilitar extensão PostGIS (idempotente)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Habilitar topologia PostGIS (opcional — para análises avançadas futura Rock-4)
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verificação pós-execução:
-- SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'postgis%';
-- Esperado: 2 linhas (postgis, postgis_topology)
