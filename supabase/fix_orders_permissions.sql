-- ==============================================================================
-- Ash-Shifa Herbals - Fix Orders & Order Items Permissions & RLS
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Grant complete privileges on tables to all Supabase roles
GRANT ALL ON TABLE public.orders TO service_role, anon, authenticated, postgres;
GRANT ALL ON TABLE public.order_items TO service_role, anon, authenticated, postgres;
GRANT ALL ON TABLE public.products TO service_role, anon, authenticated, postgres;
GRANT ALL ON TABLE public.profiles TO service_role, anon, authenticated, postgres;

-- 2. Grant permissions on schema and sequences
GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, anon, authenticated, postgres;

-- 3. Ensure order_items.id has auto-generating UUID default
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Allow user_id to be nullable or without strict foreign-key blockage for guest/new patients
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 5. Disable RLS or create unrestricted policies so order & item inserts never fail
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you prefer keeping RLS enabled, uncomment the following policies:
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all orders access" ON public.orders;
-- CREATE POLICY "Allow all orders access" ON public.orders FOR ALL USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "Allow all order_items access" ON public.order_items;
-- CREATE POLICY "Allow all order_items access" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
