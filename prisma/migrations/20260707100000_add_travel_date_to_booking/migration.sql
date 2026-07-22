-- Add travelDate column to Booking table
-- Use a temporary default so existing rows pass the NOT NULL constraint,
-- then drop the default to enforce the required constraint going forward.
ALTER TABLE "Booking" ADD COLUMN "travelDate" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "Booking" ALTER COLUMN "travelDate" DROP DEFAULT;
