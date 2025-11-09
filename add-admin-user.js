import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Load from .env
const supabaseUrl = 'https://istolikjzbdidwltccggh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdG9saWtqemJkaXdsdGNjZ2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTA4NDIsImV4cCI6MjA3NDgyNjg0Mn0.gCV0aYhgPbPAJAV-3u1sF57rBrkTZ5UxgLXDi8ThlxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdmin() {
  const username = '9676195804';
  const plainPassword = '970512';
  const hashed = bcrypt.hashSync(plainPassword, 10);

  console.log('Inserting admin user:', username);

  const { data, error } = await supabase
    .from('admin_users')
    .upsert(
      { username, password_hash: hashed },
      { onConflict: 'username' }
    );

  if (error) {
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Admin user added/updated:', data);
  }
}

addAdmin().catch(console.error);