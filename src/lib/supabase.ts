import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const demoMode = String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === 'true';

export const isSupabaseConfigured = Boolean(
  !demoMode &&
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('xyzcompany.supabase.co') &&
  !supabaseAnonKey.includes('your-anon-key-here')
);

export const demoModeEnabled = demoMode;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
