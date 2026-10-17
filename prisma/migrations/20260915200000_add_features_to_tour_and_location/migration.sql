-- Add features column to Tour table
ALTER TABLE "Tour" ADD COLUMN "features" JSONB;

-- Add features column to Transfer table
ALTER TABLE "Transfer" ADD COLUMN "features" JSONB;

