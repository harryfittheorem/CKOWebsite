/*
  # Add GHL API Key to Locations Table

  1. Changes
    - Adds `ghl_api_key` column (text, nullable) to the `locations` table
    - Allows each location to have its own GHL API key for sub-account specific operations
    - Falls back to global GHL_API_KEY environment variable if location-level key is not set
  
  2. Notes
    - Uses safe IF NOT EXISTS pattern to prevent errors on re-run
    - Column is nullable to support optional per-location configuration
    - Existing locations will have NULL values and will use the global API key
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'ghl_api_key'
  ) THEN
    ALTER TABLE locations ADD COLUMN ghl_api_key text;
  END IF;
END $$;