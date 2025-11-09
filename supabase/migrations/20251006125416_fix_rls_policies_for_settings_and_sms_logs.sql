/*
  # Fix RLS Policies for Settings and SMS Logs

  1. Changes
    - Add INSERT policy for sms_logs table to allow SMS logging
    - Update settings policies to properly allow INSERT and UPDATE operations
    - Ensure all operations work for authenticated admin users

  2. Security
    - Maintains RLS protection
    - Only authenticated users (admins) can perform these operations
    - Customers have no access to these tables
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can view sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "Admin can manage settings" ON settings;

-- Create comprehensive policies for sms_logs
CREATE POLICY "Admin can insert sms_logs"
  ON sms_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can select sms_logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (true);

-- Create comprehensive policies for settings
CREATE POLICY "Admin can select settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete settings"
  ON settings FOR DELETE
  TO authenticated
  USING (true);
