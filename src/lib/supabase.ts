import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  // Create a dummy client to prevent app crashes
  export const supabase = createClient('https://dummy.supabase.co', 'dummy-key');
} else {
  export const supabase = createClient(supabaseUrl, supabaseKey);
}