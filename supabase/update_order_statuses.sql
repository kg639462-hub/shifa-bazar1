-- ==============================================================================
-- Ash-Shifa Herbals - Add 'out_for_delivery' to orders check constraint
-- Run this in your Supabase SQL Editor if you encounter a constraint error
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Drop existing check constraint if present
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;

-- 2. Add updated check constraint including 'out_for_delivery'
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check 
    CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'));

-- 3. Confirm column permits standard fulfillment updates
COMMENT ON COLUMN public.orders.order_status IS 'Fulfillment lifecycle: pending, confirmed, processing, shipped, out_for_delivery, delivered, cancelled';
