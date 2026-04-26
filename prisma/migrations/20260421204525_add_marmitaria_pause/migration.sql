-- AlterEnum
ALTER TYPE "MarmitariaStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "marmitaria_profiles" ADD COLUMN "paused_at" TIMESTAMPTZ;
