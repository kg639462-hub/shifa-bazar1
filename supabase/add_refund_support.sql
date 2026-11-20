-- ==============================================================================
-- Ash-Shifa Herbals - Add Refund Tracking Support to Orders Table
-- Run this in your Supabase SQL Editor:
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Update payment_status check constraint to include 'refund_requested' and 'refunded'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'paid', 'refund_requested', 'refunded', 'failed'));

-- 2. Add refund tracking columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_account_type TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_account_details JSONB DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_transaction_ref TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.orders.refund_status IS 'Refund lifecycle: requested, processing, completed, rejected';
COMMENT ON COLUMN public.orders.refund_transaction_ref IS 'Bank UTR or Razorpay Refund ID';
