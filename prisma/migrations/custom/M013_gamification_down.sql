-- M013 Rollback: remove gamificação e reverte tabelas para estrutura anterior
-- ATENÇÃO: esta migration remove dados de badges e diplomas irreversivelmente.

-- 1. Remover coluna hall_of_fame dos users
ALTER TABLE users DROP COLUMN IF EXISTS hall_of_fame;

-- 2. Remover tabelas de gamificação
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS diplomas;

-- 3. Remover enum
DROP TYPE IF EXISTS "BadgeType";

-- 4. Recriar tabelas na estrutura original (pré-module-20)
CREATE TABLE badges (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug        VARCHAR(50) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT badges_user_slug_unique UNIQUE (user_id, slug)
);

CREATE INDEX "IDX_badges_user_id" ON badges (user_id);

CREATE TABLE diplomas (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month        INTEGER     NOT NULL,
  year         INTEGER     NOT NULL,
  file_url     TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT diplomas_user_month_year_unique UNIQUE (user_id, month, year)
);

CREATE INDEX "IDX_diplomas_user_id" ON diplomas (user_id);
