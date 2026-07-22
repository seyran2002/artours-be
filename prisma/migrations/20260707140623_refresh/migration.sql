/*
  Warnings:

  - You are about to drop the column `paymentStatus` on the `Booking` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH');

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- DropEnum
DROP TYPE "PaymentStatus";
