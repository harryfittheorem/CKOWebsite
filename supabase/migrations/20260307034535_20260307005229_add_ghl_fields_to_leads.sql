/*
  # Add GoHighLevel fields to leads table

  1. Changes to Tables
    - `leads`
      - Add `ghl_push_status` (text, default 'pending') - Status of push to GHL
      - Add `ghl_contact_id` (text, nullable) - GHL contact ID if successfully pushed

  2. Notes
    - ghl_push_status will track: 'pending', 'success', 'failed'
    - ghl_contact_id stores the contact ID returned by GHL API
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'ghl_push_status'
  ) THEN
    ALTER TABLE leads ADD COLUMN ghl_push_status text DEFAULT 'pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'ghl_contact_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN ghl_contact_id text;
  END IF;
END $$;