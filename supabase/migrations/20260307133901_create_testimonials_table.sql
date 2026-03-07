/*
  # Create Testimonials Table

  1. New Tables
    - `testimonials`
      - `id` (uuid, primary key)
      - `location_slug` (text, not null) - References the location this testimonial belongs to
      - `member_name` (text, not null) - Name of the member providing the testimonial
      - `member_since` (text, nullable) - When they became a member (e.g., "2023" or "January 2023")
      - `quote` (text, not null) - The testimonial quote/content
      - `rating` (integer, nullable) - Star rating out of 5
      - `is_active` (boolean, default true) - Whether to display this testimonial
      - `display_order` (integer, default 0) - Controls display order
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `testimonials` table
    - Add policy for public read access to active testimonials
    - Add policy for authenticated users to manage testimonials

  3. Indexes
    - Add index on location_slug for fast lookups
    - Add index on is_active for filtering
*/

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_slug text NOT NULL,
  member_name text NOT NULL,
  member_since text,
  quote text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active testimonials"
  ON testimonials FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update testimonials"
  ON testimonials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete testimonials"
  ON testimonials FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_testimonials_location_slug ON testimonials(location_slug);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);
