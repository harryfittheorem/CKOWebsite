/*
  # Create hero leads table for above-the-fold lead capture

  1. New Tables
    - `hero_leads`
      - `id` (uuid, primary key) - Unique identifier for each lead
      - `name` (text) - Lead's full name
      - `phone` (text) - Lead's phone number for SMS follow-up
      - `email` (text) - Lead's email address
      - `location` (text) - Location identifier (e.g., "League City")
      - `source` (text) - Form source identifier, default "hero"
      - `created_at` (timestamptz) - Timestamp of form submission
      - `metadata` (jsonb) - Optional field for additional data
  
  2. Security
    - Enable RLS on `hero_leads` table
    - Add policy for authenticated admin users to read all leads
    - Add policy for public (anon) users to insert new leads only
  
  3. Indexes
    - Index on `location` for filtering by location
    - Index on `created_at` for chronological queries
    - Index on `phone` for deduplication checks

  4. Important Notes
    - Public insert-only access allows form submissions without authentication
    - Phone is the highest-value field for SMS follow-up conversion
    - Source field differentiates hero leads from other form submissions
*/

CREATE TABLE IF NOT EXISTS hero_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  location text NOT NULL,
  source text DEFAULT 'hero',
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE hero_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public (anon) users to insert leads
CREATE POLICY "Anyone can submit hero leads"
  ON hero_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to read all leads
CREATE POLICY "Authenticated users can view all hero leads"
  ON hero_leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hero_leads_location ON hero_leads(location);
CREATE INDEX IF NOT EXISTS idx_hero_leads_created_at ON hero_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hero_leads_phone ON hero_leads(phone);