/*
  # Add additional charges fields to purchases table

  1. New Columns
    - `processing_fee` (numeric) - Processing fee charged
    - `tds_amount` (numeric) - TDS amount deducted
    - `insurance_amount` (numeric) - Insurance charges
    - `documentation_charges` (numeric) - Documentation fees
    - `other_charges` (numeric) - Any other miscellaneous charges

  2. Changes
    - Add new columns to purchases table with default values
    - All charges are optional and default to 0
*/

DO $$
BEGIN
  -- Add processing_fee column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'processing_fee'
  ) THEN
    ALTER TABLE purchases ADD COLUMN processing_fee numeric(10,2) DEFAULT 0;
  END IF;

  -- Add tds_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'tds_amount'
  ) THEN
    ALTER TABLE purchases ADD COLUMN tds_amount numeric(10,2) DEFAULT 0;
  END IF;

  -- Add insurance_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'insurance_amount'
  ) THEN
    ALTER TABLE purchases ADD COLUMN insurance_amount numeric(10,2) DEFAULT 0;
  END IF;

  -- Add documentation_charges column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'documentation_charges'
  ) THEN
    ALTER TABLE purchases ADD COLUMN documentation_charges numeric(10,2) DEFAULT 0;
  END IF;

  -- Add other_charges column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'other_charges'
  ) THEN
    ALTER TABLE purchases ADD COLUMN other_charges numeric(10,2) DEFAULT 0;
  END IF;
END $$;