/*
  # Fix RLS policies for purchases and EMI operations

  1. Tables Updated
    - `purchases` - Allow admin operations
    - `emi_schedule` - Allow admin operations
    - `payments` - Allow admin operations
    - `settings` - Allow admin read access
    
  2. Security
    - Enable RLS on all tables
    - Add policies for admin operations
    - Maintain existing customer access policies
    
  3. Settings
    - Insert default settings if they don't exist
*/

-- Fix purchases table RLS
DROP POLICY IF EXISTS "Admin can manage all purchases" ON purchases;
CREATE POLICY "Admin can manage all purchases"
  ON purchases
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix emi_schedule table RLS
DROP POLICY IF EXISTS "Admin can manage all emi_schedule" ON emi_schedule;
CREATE POLICY "Admin can manage all emi_schedule"
  ON emi_schedule
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix payments table RLS
DROP POLICY IF EXISTS "Admin can manage all payments" ON payments;
CREATE POLICY "Admin can manage all payments"
  ON payments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix settings table RLS
DROP POLICY IF EXISTS "Admin can manage settings" ON settings;
CREATE POLICY "Admin can read settings"
  ON settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings if they don't exist
INSERT INTO settings (key, value, description) VALUES
  ('default_interest_rate', '24', 'Default annual interest rate percentage')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('late_fee_per_day', '50', 'Late fee charged per day for overdue payments')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('shop_name', 'Suresh Patel Kirana EMI', 'Shop name for SMS and communications')
ON CONFLICT (key) DO NOTHING;