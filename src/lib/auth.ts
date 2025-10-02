import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  username: string;
  created_at: string;
}

export const adminLogin = async (username: string, password: string) => {
  // Simple admin login using direct database query
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  console.log('Admin login attempt:', { username, data, error });

  if (error || !data) {
    throw new Error('Invalid username or password');
  }

  // In a real app, you'd verify the password hash here
  // For demo purposes, we'll use a simple check
  if (password !== data.password_hash) {
    throw new Error('Invalid username or password');
  }

  // Store admin session in localStorage
  localStorage.setItem('admin_user', JSON.stringify(data));
  return data;
};

export const adminLogout = () => {
  localStorage.removeItem('admin_user');
};

export const getAdminUser = (): AdminUser | null => {
  const stored = localStorage.getItem('admin_user');
  return stored ? JSON.parse(stored) : null;
};

export const customerLogin = async (mobile: string, password: string) => {
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('mobile', mobile)
    .single();

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Check password
  const customerPassword = (customer as any).password || mobile; // Default to mobile if no password set
  if (customerPassword !== password) {
    throw new Error('Invalid password');
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