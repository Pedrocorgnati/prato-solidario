-- M016: Adiciona enum FoodType e campo food_type à tabela donations
-- TASK-6 intake-review CL-037

-- 1. Criar tipo enum
CREATE TYPE "FoodType" AS ENUM (
  'REFEICAO_COMPLETA',
  'PORCAO',
  'LANCHE',
  'SOBREMESA',
  'BEBIDA',
  'OUTROS'
);

-- 2. Adicionar coluna com default para retrocompatibilidade
ALTER TABLE "donations"
  ADD COLUMN "food_type" "FoodType" NOT NULL DEFAULT 'OUTROS';
