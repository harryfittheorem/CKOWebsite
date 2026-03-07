/*
  # Add Per-Location ClubReady Credentials

  1. New Columns on locations table
    - `clubready_api_key` (text, nullable) - API key for this location's ClubReady account
    - `clubready_chain_id` (text, nullable) - Chain ID for this location's ClubReady account
  
  2. New Columns on packages table
    - `location_slug` (text, nullable) - Links package to specific location
  
  3. Indexes
    - Add index on packages(location_slug) for efficient filtering
  
  4. Purpose
    - Enable each location to have its own ClubReady store credentials
    - Allow packages to be location-specific
    - Falls back to global clubready_config if location doesn't have credentials set
*/

-- Add ClubReady credentials to locations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'clubready_api_key'
  ) THEN
    ALTER TABLE locations ADD COLUMN clubready_api_key text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'clubready_chain_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN clubready_chain_id text;
  END IF;
END $$;

-- Add location_slug to packages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'packages' AND column_name = 'location_slug'
  ) THEN
    ALTER TABLE packages ADD COLUMN location_slug text;
  END IF;
END $$;

-- Add index on packages location_slug
CREATE INDEX IF NOT EXISTS idx_packages_location_slug ON packages(location_slug);