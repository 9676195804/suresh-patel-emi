/*
  # Update customer password defaults

  1. Changes
    - Set mobile number as default password for existing customers without passwords
    - Ensure all customers have a password field populated

  2. Security
    - Maintains existing RLS policies
*/

-- Update existing customers without passwords to use their mobile number as password
UPDATE customers 
SET password = mobile 
WHERE password IS NULL OR password = '';

-- Ensure password column is not null going forward
ALTER TABLE customers 
ALTER COLUMN password SET DEFAULT '';