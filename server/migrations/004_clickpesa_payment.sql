-- Add ClickPesa payment tracking columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS clickpesa_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status        TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_confirmed_at  TIMESTAMPTZ;
