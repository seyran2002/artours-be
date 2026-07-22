/*
  Warnings:

  - Made the column `enDescription` on table `Transfer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ruDescription` on table `Transfer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enLongDescription` on table `Transfer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ruLongDescription` on table `Transfer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mainImage` on table `Transfer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `minimumPrice` on table `Transfer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "entranceFees" JSONB,
ALTER COLUMN "enDescription" SET NOT NULL,
ALTER COLUMN "ruDescription" SET NOT NULL,
ALTER COLUMN "enLongDescription" SET NOT NULL,
ALTER COLUMN "ruLongDescription" SET NOT NULL,
ALTER COLUMN "mainImage" SET NOT NULL,
ALTER COLUMN "minimumPrice" SET NOT NULL;
