import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseKey = supabaseAnonKey || supabaseServiceRoleKey;

// Check if credentials are placeholders or invalid
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('https://') &&
    supabaseKey &&
    !supabaseKey.includes('placeholder')
  );
};

// Global Default Client (using Anon Key)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Admin Client (using Service Role Key for privileged server-side operations)
export const adminSupabase =
  isSupabaseConfigured() && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// User-scoped Supabase Client (Preserves Auth Token for RLS policies)
export const getSupabaseClient = (userToken = null) => {
  if (!isSupabaseConfigured()) return null;
  if (!userToken) return supabase;

  const cleanToken = userToken.startsWith('Bearer ') ? userToken.slice(7) : userToken;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
    },
  });
};

console.log(
  isSupabaseConfigured()
    ? '✅ Supabase client initialized with verified credentials'
    : '⚠️ Supabase running in fallback mode'
);
