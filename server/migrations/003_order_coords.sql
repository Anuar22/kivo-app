-- Add delivery coordinates to orders so we can show the drop-pin on a map
-- and calculate accurate distances later (e.g. for rider assignment in Phase 2).
-- Both columns are nullable — existing orders placed before this migration
-- won't have coords, and that's fine.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_lat  numeric(10, 7),
  ADD COLUMN IF NOT EXISTS delivery_lng  numeric(10, 7);
