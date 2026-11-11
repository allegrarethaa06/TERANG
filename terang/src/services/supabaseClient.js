/**
 * Supabase client TERANG.
 * Hanya memakai URL + publishable (anon) key. JANGAN pernah memakai service_role key di frontend.
 * Jika env belum diisi, aplikasi otomatis kembali ke mode demo lokal.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_PUBLISHABLE_KEY = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
).trim();

export const IS_SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const REPORT_PHOTOS_BUCKET = 'report-photos';

export const supabase = IS_SUPABASE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
