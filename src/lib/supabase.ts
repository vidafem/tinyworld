import { createClient } from '@supabase/supabase-js';

export const isSupabaseConfigured = 
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && 
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy') && 
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('tu-proyecto');

const supabaseUrl = isSupabaseConfigured ? process.env.NEXT_PUBLIC_SUPABASE_URL! : 'https://dummy.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! : 'dummy-key';

if (typeof window !== 'undefined' && !isSupabaseConfigured) {
  console.warn(
    '⚠️ [TinyWorld] Las variables de entorno de Supabase están ausentes o contienen placeholders. Conéctate a Vercel usando "npx vercel env pull .env.local" para trabajar en local.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')),
    detectSessionInUrl: true,
    storageKey: 'tinyworld-auth-token'
  }
});

