/*
  Warnings:

  - Added the required column `hyName` to the `Tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enLongDescription` to the `Tour` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hyDescription` to the `Tour` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hyLongDescription` to the `Tour` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hyTitle` to the `Tour` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruLongDescription` to the `Tour` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hyDescription` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hyLongDescription` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hyTitle` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "hyName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "enLongDescription" TEXT NOT NULL,
ADD COLUMN     "hyDescription" TEXT NOT NULL,
ADD COLUMN     "hyLongDescription" TEXT NOT NULL,
ADD COLUMN     "hyTitle" TEXT NOT NULL,
ADD COLUMN     "ruLongDescription" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "hyDescription" TEXT NOT NULL,
ADD COLUMN     "hyLongDescription" TEXT NOT NULL,
ADD COLUMN     "hyTitle" TEXT NOT NULL;
