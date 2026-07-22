/*
  Warnings:

  - You are about to drop the column `distanceFromYerevan` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `entranceFees` on the `Transfer` table. All the data in the column will be lost.
  - Added the required column `fromAddressText` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromLat` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromLng` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromPlaceId` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAddressText` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toLat` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toLng` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toPlaceId` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Transfer_slug_key";

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "distanceFromYerevan",
DROP COLUMN "entranceFees",
ADD COLUMN     "fromAddressText" TEXT NOT NULL,
ADD COLUMN     "fromLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fromLng" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fromPlaceId" TEXT NOT NULL,
ADD COLUMN     "toAddressText" TEXT NOT NULL,
ADD COLUMN     "toLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "toLng" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "toPlaceId" TEXT NOT NULL;
