-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "isOvernight" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mealOptions" JSONB,
ADD COLUMN     "starRating" INTEGER;
