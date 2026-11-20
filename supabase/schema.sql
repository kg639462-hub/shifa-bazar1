-- ==============================================================================
-- Ash-Shifa Herbals Dispensary Database Schema
-- Architecture: PostgreSQL on Supabase
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'practitioner', 'admin')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Products Table (Strict Requirement: Exactly 4 Images per product)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || substr(uuid_generate_v4()::text, 1, 8)),
    name TEXT NOT NULL,
    scientific_name TEXT,
    category TEXT NOT NULL, -- e.g. 'Tincture', 'Formulation', 'Topical Balm'
    batch_lot TEXT NOT NULL, -- e.g. 'LOT #702', 'BATCH 814'
    short_desc TEXT NOT NULL,
    full_desc TEXT NOT NULL,
    dosage TEXT,
    ingredients TEXT[] DEFAULT '{}',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER DEFAULT 100 CHECK (stock >= 0),
    extract_type TEXT DEFAULT 'Extract', -- e.g. 'Extract', '60 Veg Caps'
    co_a_verified BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INTEGER DEFAULT 0,
    -- Strictly 4 high-resolution imagery URLs
    images TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(images, 1) = 4),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_fee NUMERIC(10, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cod')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    -- Order lifecycle status
    order_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (
        order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    ),
    -- Shipping & Patient Delivery Details
    shipping_name TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_pincode TEXT NOT NULL,
    -- Order Cancellation Fields (strictly cancellable before shipping)
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 7. Trigger to automatically create a profile record upon Supabase Auth User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Botanical Patient'),
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
