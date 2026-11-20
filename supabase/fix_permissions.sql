-- ==============================================================================
-- Grant API Table Privileges to anon and authenticated roles
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/eeqipepnpfutyxvpufqy/sql
-- ==============================================================================

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 3. Ensure future tables also inherit full access
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- 4. Enable Read on products for everybody
DROP POLICY IF EXISTS "Dispensary catalog is viewable by all patients and visitors" ON public.products;
CREATE POLICY "Dispensary catalog is viewable by all patients and visitors"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING (true);

-- 5. Enable inserting/updating products
DROP POLICY IF EXISTS "Enable insert and update on products" ON public.products;
CREATE POLICY "Enable insert and update on products"
    ON public.products FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
