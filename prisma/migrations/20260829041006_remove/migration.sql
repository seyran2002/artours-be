/*
  Warnings:

  - You are about to drop the column `enLongDescription` on the `Tour` table. All the data in the column will be lost.
  - You are about to drop the column `hyLongDescription` on the `Tour` table. All the data in the column will be lost.
  - You are about to drop the column `ruLongDescription` on the `Tour` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tour" DROP COLUMN "enLongDescription",
DROP COLUMN "hyLongDescription",
DROP COLUMN "ruLongDescription";
