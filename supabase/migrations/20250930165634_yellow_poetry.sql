/*
  # Fix admin user setup and add new admin

  1. Security Changes
    - Update RLS policy to allow admin user creation
    - Add policy for admin authentication

  2. Admin Users
    - Insert default admin user (admin/password)
    - Insert new admin user (jadhavsuresh24895@gmail.com/970512)
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow initial admin user creation" ON admin_users;

-- Create a more permissive policy for admin user management
CREATE POLICY "Allow admin user operations"
  ON admin_users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert default admin user
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', 'password')
ON CONFLICT (username) DO NOTHING;

-- Insert new admin user
INSERT INTO admin_users (username, password_hash) 
VALUES ('jadhavsuresh24895@gmail.com', '970512')
ON CONFLICT (username) DO NOTHING;