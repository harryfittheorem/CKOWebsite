/*
  # Add location page fields

  1. Changes
    - Add `email` column for location contact email
    - Add `hours` column for business hours display
    - Add `hero_headline` column for custom hero headline (optional)
    - Add `google_maps_embed_url` column for Google Maps iframe
    - Add `about_text` column for location-specific about section
    
  2. Notes
    - All fields are nullable except google_maps_embed_url which has a default
    - hero_headline falls back to default if not set (handled in frontend)
    - Using DO blocks to safely add columns if they don't exist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'email'
  ) THEN
    ALTER TABLE locations ADD COLUMN email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'hours'
  ) THEN
    ALTER TABLE locations ADD COLUMN hours text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'hero_headline'
  ) THEN
    ALTER TABLE locations ADD COLUMN hero_headline text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'google_maps_embed_url'
  ) THEN
    ALTER TABLE locations ADD COLUMN google_maps_embed_url text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'about_text'
  ) THEN
    ALTER TABLE locations ADD COLUMN about_text text;
  END IF;
END $$;