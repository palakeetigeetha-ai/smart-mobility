import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_URL =
  process.env.SUPABASE_URL || 'https://jjcszxwhgbyyzvitcahd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_PROJECT_URL &&
      (SUPABASE_ANON_KEY.trim() !== '' || SUPABASE_SERVICE_ROLE_KEY.trim() !== '') &&
      SUPABASE_ANON_KEY !== 'your-supabase-anon-key-placeholder'
  );
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your-supabase-anon-key-placeholder') {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (error) {
      console.warn('⚠️ Could not initialize Supabase public client:', error);
      return null;
    }
  }

  return supabaseClient;
};

export const getSupabaseAdminClient = (): SupabaseClient | null => {
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_PROJECT_URL || !key || key.includes('placeholder')) {
    return null;
  }

  if (!supabaseAdminClient) {
    try {
      supabaseAdminClient = createClient(SUPABASE_PROJECT_URL, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (error) {
      console.warn('⚠️ Could not initialize Supabase admin client:', error);
      return null;
    }
  }

  return supabaseAdminClient;
};

export const getSupabaseStatus = () => {
  const isPostgres = Boolean(
    process.env.DATABASE_URL &&
      (process.env.DATABASE_URL.startsWith('postgresql://') ||
        process.env.DATABASE_URL.startsWith('postgres://'))
  );

  return {
    projectUrl: SUPABASE_PROJECT_URL,
    configured: isSupabaseConfigured(),
    databaseMode: isPostgres ? 'SUPABASE_POSTGRESQL' : 'SQLITE_LOCAL',
    hasAnonKey: Boolean(SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('placeholder')),
    hasServiceKey: Boolean(
      SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
    )
  };
};
