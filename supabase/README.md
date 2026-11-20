# Ash-Shifa Herbals - Supabase PostgreSQL Database Setup

This project uses **Supabase** for user authentication, session management, and PostgreSQL database storage.

## 🚀 Quick Setup Instructions

1. **Create a Supabase Project:**
   - Go to [https://supabase.com](https://supabase.com) and create a free project named `Ash-Shifa Herbals`.

2. **Execute Database Migrations in SQL Editor:**
   - In your Supabase dashboard, click on the **SQL Editor** tab on the left sidebar.
   - Run the scripts in the following order:
     1. `supabase/schema.sql` (Creates tables: `profiles`, `products`, `orders`, `order_items`, indexes, triggers)
     2. `supabase/rls_policies.sql` (Enables Row Level Security and permission policies)
     3. `supabase/seed.sql` (Populates authentic dispensary products with strictly 4 images each)

3. **Get Your API Credentials:**
   - In Supabase, go to **Project Settings** -> **API**.
   - Copy:
     - `Project URL`
     - `anon` `public` key
     - `service_role` key (keep private for backend)

4. **Update Environment Files:**
   - Place these in `server/.env` and `client/.env`:
     ```env
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```

## 🔒 Order Cancellation Security Rule
The database contains a strict RLS policy:
```sql
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
```
This ensures orders can ONLY be cancelled when they are still in pre-dispatch status (`pending`, `confirmed`, `processing`), perfectly guarding your apothecary logistics.
