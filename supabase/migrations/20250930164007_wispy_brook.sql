/*
  # EMI Management System Database Schema

  1. New Tables
    - `admin_users` - Admin authentication
    - `customers` - Customer information
    - `purchases` - Purchase records with EMI details
    - `emi_schedule` - Monthly EMI schedule for each purchase
    - `payments` - Payment tracking
    - `settings` - System settings
    - `sms_logs` - SMS notification logs

  2. Security
    - Enable RLS on all tables
    - Add policies for admin and customer access
    - Secure customer portal access
*/

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text UNIQUE NOT NULL,
  aadhaar text,
  pan text,
  guarantor_name text,
  guarantor_mobile text,
  guarantor_address text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  total_price decimal(10,2) NOT NULL,
  down_payment decimal(10,2) DEFAULT 0,
  loan_amount decimal(10,2) NOT NULL,
  tenure integer NOT NULL CHECK (tenure IN (6, 12)),
  interest_rate decimal(5,2) NOT NULL,
  emi_amount decimal(10,2) NOT NULL,
  start_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- EMI Schedule table
CREATE TABLE IF NOT EXISTS emi_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  principal_amount decimal(10,2) NOT NULL,
  interest_amount decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_date date,
  late_fee decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emi_schedule_id uuid REFERENCES emi_schedule(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  amount_paid decimal(10,2) NOT NULL,
  late_fee decimal(10,2) DEFAULT 0,
  payment_date date NOT NULL,
  payment_method text DEFAULT 'cash',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  mobile text NOT NULL,
  message text NOT NULL,
  sms_type text NOT NULL,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  response text,
  created_at timestamptz DEFAULT now()
);

-- Customer OTPs table for authentication
CREATE TABLE IF NOT EXISTS customer_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_otps ENABLE ROW LEVEL SECURITY;

-- Admin policies (allow all operations for authenticated admins)
CREATE POLICY "Admin can manage all data" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin can manage all purchases" ON purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin can manage all emi_schedule" ON emi_schedule FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin can manage all payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin can manage settings" ON settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin can view sms_logs" ON sms_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage otps" ON customer_otps FOR ALL TO authenticated USING (true);

-- Customer policies (customers can only see their own data)
CREATE POLICY "Customers can view own data" ON customers FOR SELECT TO anon USING (mobile = current_setting('app.customer_mobile', true));
CREATE POLICY "Customers can view own purchases" ON purchases FOR SELECT TO anon USING (
  customer_id IN (SELECT id FROM customers WHERE mobile = current_setting('app.customer_mobile', true))
);
CREATE POLICY "Customers can view own emi_schedule" ON emi_schedule FOR SELECT TO anon USING (
  purchase_id IN (SELECT id FROM purchases WHERE customer_id IN (SELECT id FROM customers WHERE mobile = current_setting('app.customer_mobile', true)))
);
CREATE POLICY "Customers can view own payments" ON payments FOR SELECT TO anon USING (
  customer_id IN (SELECT id FROM customers WHERE mobile = current_setting('app.customer_mobile', true))
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('shop_name', 'Suresh Patel Kirana EMI', 'Shop name used in SMS and branding'),
('default_interest_rate', '24', 'Default annual interest rate percentage'),
('late_fee_per_day', '50', 'Late fee charged per day after due date'),
('sms_api_key', '', 'SMS API key for notifications'),
('sms_sender_id', 'EMIKIT', 'SMS sender ID'),
('admin_username', 'admin', 'Default admin username'),
('admin_password', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Default admin password hash (password)') -- password: "password"
ON CONFLICT (key) DO NOTHING;

-- Insert default admin user
INSERT INTO admin_users (username, password_hash) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi') -- password: "password"
ON CONFLICT (username) DO NOTHING;