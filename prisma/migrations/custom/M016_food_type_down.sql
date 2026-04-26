-- M016 down: Remove food_type de donations e enum FoodType

ALTER TABLE "donations" DROP COLUMN IF EXISTS "food_type";
DROP TYPE IF EXISTS "FoodType";
