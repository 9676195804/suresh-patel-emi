
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for settings
DROP POLICY IF EXISTS "Admin can select settings" ON settings;
DROP POLICY IF EXISTS "Admin can insert settings" ON settings;
DROP POLICY IF EXISTS "Admin can update settings" ON settings;
DROP POLICY IF EXISTS "Admin can delete settings" ON settings;

-- Create restrictive policies for settings
CREATE POLICY "Admins can manage settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
