/*
  # Add customer password and default settings

  1. Schema Changes
    - Add password column to customers table
    - Insert default settings for UPI ID

  2. Data Updates
    - Add default UPI ID setting
*/

-- Add password column to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'password'
  ) THEN
    ALTER TABLE customers ADD COLUMN password text;
  END IF;
END $$;

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('upi_id', 'jadhavsuresh2512@axl', 'UPI ID for customer payments')
ON CONFLICT (key) DO NOTHING;