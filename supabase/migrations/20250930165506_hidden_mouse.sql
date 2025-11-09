/*
  # Fix Admin User RLS Policy

  1. Security Changes
    - Add policy to allow initial admin user creation when table is empty
    - This ensures only the first admin user can be created via the application
    - Maintains security while allowing bootstrap functionality

  2. Changes
    - Create policy for INSERT operations on admin_users table
    - Policy only allows insert when no admin users exist yet
*/

-- Allow initial admin user creation when table is empty
CREATE POLICY "Allow initial admin user creation" 
  ON public.admin_users 
  FOR INSERT 
  WITH CHECK ((SELECT count(*) FROM public.admin_users) = 0);