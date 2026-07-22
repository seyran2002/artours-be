-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';

-- CreateIndex
CREATE INDEX "Booking_status_travelDate_idx" ON "Booking"("status", "travelDate");
