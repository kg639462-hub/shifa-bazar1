-- ==============================================================================
-- Ash-Shifa Herbals - Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- PRODUCTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Dispensary catalog is viewable by all patients and visitors"
    ON public.products FOR SELECT
    TO public
    USING (true);

-- ------------------------------------------------------------------------------
-- ORDERS POLICIES
-- ------------------------------------------------------------------------------
-- Patients can view their own orders
CREATE POLICY "Users can view their own dispensary orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Patients can create their own orders
CREATE POLICY "Users can create dispensary orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Patients can cancel orders strictly BEFORE shipping
CREATE POLICY "Users can cancel their un-shipped orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id AND
        order_status IN ('pending', 'confirmed', 'processing')
    )
    WITH CHECK (
        auth.uid() = user_id AND
        order_status = 'cancelled'
    );

-- ------------------------------------------------------------------------------
-- ORDER ITEMS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view items in their own orders"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert items for their own orders"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );
