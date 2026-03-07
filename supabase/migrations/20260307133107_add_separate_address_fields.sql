/*
  # Add Separate Address Fields to Locations Table

  1. Changes
    - Add `city` column (text, nullable) to store city name separately
    - Add `state` column (text, nullable) to store state abbreviation separately
    - Add `zip` column (text, nullable) to store ZIP code separately
    - Update existing League City location with separated address data

  2. Notes
    - Uses safe DO $$ IF NOT EXISTS blocks to prevent errors on re-run
    - The `address` field will now contain only street address
    - City, state, and zip are stored in their own columns for better data structure
*/

-- Add city column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'city'
  ) THEN
    ALTER TABLE locations ADD COLUMN city text;
  END IF;
END $$;

-- Add state column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'state'
  ) THEN
    ALTER TABLE locations ADD COLUMN state text;
  END IF;
END $$;

-- Add zip column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'zip'
  ) THEN
    ALTER TABLE locations ADD COLUMN zip text;
  END IF;
END $$;

-- Update League City location with separated address fields
UPDATE locations
SET
  city = 'League City',
  state = 'TX',
  zip = '77573'
WHERE slug = 'league-city';
