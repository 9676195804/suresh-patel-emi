import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://istolikjzbdidwltccggh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdG9saWtqemJkaXdsdGNjZ2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTA4NDIsImV4cCI6MjA3NDgyNjg0Mn0.gCV0aYhgPbPAJAV-3u1sF57rBrkTZ5UxgLXDi8ThlxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUser() {
  console.log('🔍 Checking admin_users table...');
  
  try {
    // Check if admin user exists
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'admin')
      .maybeSingle();
    
    if (adminError) {
      console.error('❌ Error querying admin_users:', adminError);
      return;
    }
    
    if (adminData) {
      console.log('✅ Admin user found:');
      console.log('   - Username:', adminData.username);
      console.log('   - Password hash:', adminData.password_hash);
      console.log('   - Created at:', adminData.created_at);
      
      // Check if it's the expected bcrypt hash
      const expectedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
      if (adminData.password_hash === expectedHash) {
        console.log('\n✅ Password hash matches expected "password"');
        console.log('   📝 Try logging in with:');
        console.log('   👤 Username: admin');
        console.log('   🔑 Password: password');
      } else {
        console.log('\n⚠️  Password hash does NOT match expected "password"');
        console.log('   Expected:', expectedHash);
        console.log('   Actual:', adminData.password_hash);
      }
    } else {
      console.log('❌ No admin user found with username "admin"');
      console.log('\n📝 You need to insert the default admin user.');
      console.log('   Run this SQL in your Supabase SQL editor:');
      console.log('   INSERT INTO admin_users (username, password_hash) VALUES');
      console.log('   (\'admin\', \'$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi\');');
    }
    
    // Check all admin users
    console.log('\n--- All admin users ---');
    const { data: allAdmins, error: allError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (allError) {
      console.error('❌ Error getting all admin users:', allError);
    } else if (allAdmins && allAdmins.length > 0) {
      allAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. Username: ${admin.username}, Created: ${admin.created_at}`);
      });
    } else {
      console.log('❌ No admin users found in database');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
}

// Run the diagnostic
checkAdminUser().then(() => {
  console.log('\n🔍 Diagnostic complete.');
}).catch(console.error);