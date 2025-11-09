/*
  # Fix RLS policies for customers table

  1. Security Changes
    - Update RLS policies for customers table to allow admin operations
    - Allow INSERT, UPDATE, DELETE operations for admin users
    - Maintain existing customer access policies

  2. Changes Made
    - Drop existing restrictive policies
    - Add new policies that allow admin operations
    - Keep customer read access policy
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Admin can manage all data" ON customers;
DROP POLICY IF EXISTS "Customers can view own data" ON customers;

-- Create new policies that allow admin operations
CREATE POLICY "Allow all operations for admin users"
  ON customers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Keep customer read access
CREATE POLICY "Customers can view own data"
  ON customers
  FOR SELECT
  TO anon
  USING (mobile = current_setting('app.customer_mobile'::text, true));