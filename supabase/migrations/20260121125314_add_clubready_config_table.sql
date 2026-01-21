/*
  # Add ClubReady Configuration Table

  1. New Tables
    - `clubready_config`
      - `id` (integer, primary key)
      - `api_key` (text) - ClubReady API key
      - `chain_id` (text) - Chain ID
      - `store_id` (text) - Store ID
      - `api_url` (text) - API base URL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `clubready_config` table
    - No public access policies (only edge functions can access using service role)
  
  3. Initial Data
    - Insert default configuration from environment
*/

CREATE TABLE IF NOT EXISTS clubready_config (
  id integer PRIMARY KEY DEFAULT 1,
  api_key text NOT NULL,
  chain_id text NOT NULL,
  store_id text NOT NULL,
  api_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE clubready_config ENABLE ROW LEVEL SECURITY;

-- Insert the configuration
INSERT INTO clubready_config (id, api_key, chain_id, store_id, api_url)
VALUES (
  1,
  '4649e652-17e8-4417-b8da-ebcec54afddf',
  '9078',
  '9078',
  'https://www.clubready.com/api/current'
)
ON CONFLICT (id) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  chain_id = EXCLUDED.chain_id,
  store_id = EXCLUDED.store_id,
  api_url = EXCLUDED.api_url,
  updated_at = now();
