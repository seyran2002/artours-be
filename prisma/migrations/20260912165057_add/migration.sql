-- This migration was replaced with a no-op.
-- The original SQL attempted to remove TRANSFER from BookingType but failed
-- mid-transaction (the transaction was aborted and rolled back automatically).
-- BookingType therefore still contains TRANSFER in the database.
-- The enum value is preserved intentionally; see migration 20260912210019.

