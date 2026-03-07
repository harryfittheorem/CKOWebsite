/*
  # Add Social Media Fields to Locations Table

  1. Changes
    - Add `instagram_url` column (text, nullable) - Instagram profile URL for this location
    - Add `facebook_url` column (text, nullable) - Facebook page URL for this location

  2. Notes
    - Uses safe DO $$ IF NOT EXISTS blocks to prevent errors on re-run
    - These fields allow each location to have their own social media links
*/

-- Add instagram_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE locations ADD COLUMN instagram_url text;
  END IF;
END $$;

-- Add facebook_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE locations ADD COLUMN facebook_url text;
  END IF;
END $$;
