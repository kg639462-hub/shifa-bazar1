import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-ash-shifa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
