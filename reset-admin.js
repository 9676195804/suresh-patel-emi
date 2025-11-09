import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function resetAdmin() {
  // 1. Ensure table exists (idempotent)
  const createSQL = `
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
  `;
  const { error: ddlErr } = await supabase.rpc('exec_sql', { sql: createSQL });
  if (ddlErr && !ddlErr.message.includes('already exists')) {
    console.error('DDL error:', ddlErr);
    return;
  }

  // 2. Delete any existing admin with this username
  await supabase.from('admin_users').delete().eq('username', '9676195804');

  // 3. Insert fresh admin
  const hash = await bcrypt.hash('970512', 10);
  const { data, error } = await supabase
    .from('admin_users')
    .insert([{ username: '9676195804', password_hash: hash }]);

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('✅ Admin user 9676195804 / 970512 created');
  }
}

resetAdmin();