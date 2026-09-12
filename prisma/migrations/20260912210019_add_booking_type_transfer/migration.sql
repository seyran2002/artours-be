-- AlterEnum: add TRANSFER as a first-class BookingType value.
-- IF NOT EXISTS makes this idempotent (safe if the value already exists in the DB).
ALTER TYPE "BookingType" ADD VALUE IF NOT EXISTS 'TRANSFER';
