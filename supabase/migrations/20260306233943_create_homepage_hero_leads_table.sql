/*
  # Create homepage hero leads table with location matching data

  1. New Tables
    - `leads`
      - `id` (uuid, primary key) - Unique identifier for each lead
      - `name` (text) - Lead's full name
      - `phone` (text) - Lead's phone number formatted as (555) 000-0000
      - `email` (text) - Lead's email address
      - `location_slug` (text) - Matched location slug or "waitlist"
      - `location_name` (text) - Matched location display name or "Coming Soon"
      - `miles_from_visitor` (numeric) - Distance in miles from visitor ZIP, null for waitlist
      - `source` (text) - Lead source identifier (e.g., "homepage-hero", "hero")
      - `created_at` (timestamptz) - Timestamp of form submission
      - `metadata` (jsonb) - Optional field for additional data
  
  2. Security
    - Enable RLS on `leads` table
    - Add policy for public (anon) users to insert new leads only
    - Add policy for authenticated admin users to read all leads
  
  3. Indexes
    - Index on `location_slug` for filtering by location
    - Index on `source` for analytics by source
    - Index on `created_at` for chronological queries
    - Index on `email` for deduplication checks

  4. Important Notes
    - Public insert-only access allows form submissions without authentication
    - Phone field stores formatted US phone numbers for SMS follow-up
    - miles_from_visitor can be null for waitlist leads outside service radius
    - Consolidates both hero and homepage-hero leads into single table
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  location_slug text NOT NULL,
  location_name text NOT NULL,
  miles_from_visitor numeric(6, 2),
  source text DEFAULT 'homepage-hero',
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit leads"
  ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_leads_location_slug ON leads(location_slug);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);