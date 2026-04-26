-- M013: module-20-gamificacao — Atualiza tabelas badges/diplomas e adiciona BadgeType enum
-- Rollback: M013_gamification_down.sql

-- 1. Adicionar coluna hall_of_fame no users (opt-in para o Hall da Fama público)
ALTER TABLE users ADD COLUMN IF NOT EXISTS hall_of_fame BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Criar enum BadgeType
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BadgeType') THEN
    CREATE TYPE "BadgeType" AS ENUM (
      'PRIMEIRA_DOACAO',
      'DOADOR_FREQUENTE',
      'HEROI_DO_MES',
      'CENTURIAO',
      'MESTRE'
    );
  END IF;
END$$;

-- 3. Recriar tabela badges com estrutura correta para module-20
-- (tabela anterior usava slug/name/description — incompatível com a spec de gamificação tipada)
DROP TABLE IF EXISTS badges;

CREATE TABLE badges (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        "BadgeType" NOT NULL,
  month       INTEGER,               -- 1-12; NULL para badges cumulativos (CENTURIAO, MESTRE)
  year        INTEGER     NOT NULL,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT badges_user_type_month_year_unique UNIQUE (user_id, type, month, year)
);

CREATE INDEX IF NOT EXISTS "IDX_badges_user_id" ON badges (user_id);
CREATE INDEX IF NOT EXISTS "IDX_badges_type_month_year" ON badges (type, month, year);

-- 4. Recriar tabela diplomas com estrutura correta para module-20
-- (tabela anterior tinha month como NOT NULL e fileUrl — incompatível com a spec)
DROP TABLE IF EXISTS diplomas;

CREATE TABLE diplomas (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year         INTEGER     NOT NULL,
  storage_url  TEXT        NOT NULL,  -- caminho interno no Supabase Storage
  signed_url   TEXT,                  -- URL assinada (valida por 90 dias)
  signed_until TIMESTAMPTZ,           -- expiração da URL assinada
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT diplomas_user_year_unique UNIQUE (user_id, year)
);

CREATE INDEX IF NOT EXISTS "IDX_diplomas_user_id" ON diplomas (user_id);
