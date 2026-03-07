/*
  # Add GHL and ClubReady integration fields

  1. Changes
    - Add `ghl_calendar_url` column for GoHighLevel calendar booking URL
    - Add `ghl_location_id` column for GoHighLevel location identifier
    - Add `clubready_site_id` column for ClubReady site identifier
    
  2. Notes
    - All fields are nullable to allow flexible integration setup
    - Using DO blocks to safely add columns if they don't exist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'ghl_calendar_url'
  ) THEN
    ALTER TABLE locations ADD COLUMN ghl_calendar_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'ghl_location_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN ghl_location_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'clubready_site_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN clubready_site_id text;
  END IF;
END $$;
