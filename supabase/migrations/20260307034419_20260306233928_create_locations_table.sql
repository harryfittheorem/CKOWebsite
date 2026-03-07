/*
  # Create locations table for CKO gym locations

  1. New Tables
    - `locations`
      - `id` (uuid, primary key) - Unique identifier for each location
      - `name` (text) - Location display name (e.g., "League City")
      - `slug` (text, unique) - URL-safe identifier (e.g., "league-city")
      - `address` (text) - Full street address
      - `phone` (text) - Contact phone number
      - `lat` (numeric) - Latitude coordinate for distance calculations
      - `lng` (numeric) - Longitude coordinate for distance calculations
      - `is_active` (boolean) - Whether location accepts new members
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last modification timestamp
  
  2. Security
    - Enable RLS on `locations` table
    - Add policy for public read access (anyone can view active locations)
    - Add policy for authenticated admin users to manage locations
  
  3. Indexes
    - Index on `slug` for fast lookups
    - Index on `is_active` for filtering active locations
    - Index on coordinates for potential geographic queries

  4. Initial Data
    - Insert League City location with actual coordinates
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  lat numeric(10, 7) NOT NULL,
  lng numeric(10, 7) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active locations"
  ON locations
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(lat, lng);

INSERT INTO locations (name, slug, address, phone, lat, lng, is_active)
VALUES 
  ('League City', 'league-city', '830 W Main Street, League City, TX 77573', '(281) 724-4422', 29.5074436, -95.0949303, true)
ON CONFLICT (slug) DO NOTHING;