import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  username: string;
  created_at: string;
}

export const adminLogin = async (username: string, password: string) => {
  console.log('Admin login attempt for username:', username);

  // First, authenticate with Supabase Auth using email/password
  // We'll use username@admin.local as the email format
  const email = `${username}@admin.local`;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('Auth error:', authError);

    // Fallback to direct database query if Supabase auth fails
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Invalid username or password');
    }

    if (password !== data.password_hash) {
      throw new Error('Invalid username or password');
    }

    // Store admin session in localStorage
    localStorage.setItem('admin_user', JSON.stringify(data));
    localStorage.setItem('admin_authenticated', 'true');
    return data;
  }

  // If Supabase auth succeeds, get admin data from database
  const { data: adminData, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (adminError || !adminData) {
    throw new Error('Admin user not found in database');
  }

  // Store admin session
  localStorage.setItem('admin_user', JSON.stringify(adminData));
  localStorage.setItem('admin_authenticated', 'true');
  localStorage.setItem('supabase_session', JSON.stringify(authData.session));

  console.log('Admin login successful:', adminData.username);
  return adminData;
};

export const adminLogout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_authenticated');
  localStorage.removeItem('supabase_session');
};

export const getAdminUser = (): AdminUser | null => {
  const stored = localStorage.getItem('admin_user');
  return stored ? JSON.parse(stored) : null;
};

export const customerLogin = async (mobile: string, password: string) => {
  // Try to find customer by exact mobile, then try with +91 prefix if not found
  let { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('mobile', mobile)
    .maybeSingle();

  if (!customer && !mobile.startsWith('+')) {
    const withCountry = `+91${mobile}`;
    const res = await supabase
      .from('customers')
      .select('*')
      .eq('mobile', withCountry)
      .maybeSingle();
    customer = res.data as any;
  }

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Check password
  const storedPassword = (customer as any).password || (customer as any).password_hash || null;

  // Accept if stored password matches, or if no stored password then allow default passwords
  const defaultPasswords = [customer.mobile, 'password'];
  if (storedPassword) {
    if (storedPassword !== password) {
      throw new Error('Invalid password');
    }
  } else {
    if (!defaultPasswords.includes(password)) {
      throw new Error('Invalid password');
    }
  }

  // Store customer session
  localStorage.setItem('customer_user', JSON.stringify(customer));
  return customer;
};

export const customerLogout = () => {
  localStorage.removeItem('customer_user');
};

export const getCustomerUser = () => {
  const stored = localStorage.getItem('customer_user');
  return stored ? JSON.parse(stored) : null;
};