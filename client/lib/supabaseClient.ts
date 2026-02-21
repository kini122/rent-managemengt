import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

console.log('[Supabase Init] URL configured:', !!supabaseUrl);
console.log('[Supabase Init] Key configured:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase configuration!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_KEY:', supabaseKey);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

export const isConfigured = !!(supabaseUrl && supabaseKey);

console.log('[Supabase Init] Client created. Configured:', isConfigured);
