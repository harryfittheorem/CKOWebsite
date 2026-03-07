/*
  # Create location media table

  1. New Tables
    - `location_media`
      - `id` (uuid, primary key)
      - `location_slug` (text, not null) - Reference to location
      - `media_type` (text, not null) - Type of media: 'hero_image', 'hero_video_id', etc.
      - `url` (text, not null) - URL or ID for the media
      - `alt_text` (text, nullable) - Alternative text for images
      - `display_order` (integer, default 0) - Order to display media
      - `is_active` (boolean, default true) - Whether media is active
      - `created_at` (timestamptz, default now())

  2. Indexes
    - Index on `location_slug` for fast lookups
    - Composite index on `location_slug, is_active, display_order` for queries

  3. Security
    - Enable RLS on `location_media` table
    - Add policy for public read access to active media

  4. Seed Data
    - Add hero video ID for league-city location
*/

CREATE TABLE IF NOT EXISTS location_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_slug text NOT NULL,
  media_type text NOT NULL,
  url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_media_slug ON location_media (location_slug);
CREATE INDEX IF NOT EXISTS idx_location_media_lookup ON location_media (location_slug, is_active, display_order);

ALTER TABLE location_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'location_media' 
    AND policyname = 'Public can view active location media'
  ) THEN
    CREATE POLICY "Public can view active location media"
      ON location_media
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;
END $$;

INSERT INTO location_media (location_slug, media_type, url, display_order)
VALUES ('league-city', 'hero_video_id', 'S_yWGemBM9Q', 1);
