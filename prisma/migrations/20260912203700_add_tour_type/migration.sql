-- CreateEnum
CREATE TYPE "TourType" AS ENUM ('TOUR', 'TRANSFER');

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN "type" "TourType" NOT NULL DEFAULT 'TOUR';
