/*
  # Add Location Content Tables

  1. New Columns on locations table
    - `show_events` (boolean) - Toggle visibility of events section
    - `show_instructors` (boolean) - Toggle visibility of instructors section
    - `show_programs` (boolean) - Toggle visibility of programs section
    - `show_success_stories` (boolean) - Toggle visibility of success stories section

  2. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `location_slug` (text, foreign key to locations)
      - `title` (text)
      - `description` (text)
      - `event_date` (date)
      - `end_date` (date)
      - `cta_label` (text)
      - `cta_url` (text)
      - `image_url` (text)
      - `is_active` (boolean)
      - `is_corporate_template` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `instructors`
      - `id` (uuid, primary key)
      - `location_slug` (text, foreign key to locations)
      - `name` (text)
      - `title` (text)
      - `bio` (text)
      - `certifications` (text)
      - `specialties` (text)
      - `photo_url` (text)
      - `display_order` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `programs`
      - `id` (uuid, primary key)
      - `location_slug` (text, foreign key to locations)
      - `name` (text)
      - `duration` (text)
      - `description` (text)
      - `whats_included` (text)
      - `cta_label` (text)
      - `cta_url` (text)
      - `image_url` (text)
      - `is_active` (boolean)
      - `is_corporate_template` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `success_stories`
      - `id` (uuid, primary key)
      - `location_slug` (text, foreign key to locations)
      - `member_name` (text)
      - `program_name` (text)
      - `story` (text)
      - `result_stat` (text)
      - `before_image_url` (text)
      - `after_image_url` (text)
      - `is_active` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Performance Indexes
    - Event location and active date indexes
    - Foreign key indexes for all location_slug references
    
  4. Security
    - Enable RLS on all new tables
    - Public read access for all content tables
    - Authenticated users can manage all content
    - Storage bucket policies for location media uploads

  5. Storage
    - Creates location-media bucket for instructor photos and success story images
    - Public read access, authenticated upload/delete
*/

-- Section visibility flags on locations table
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS show_events boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_instructors boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_programs boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_success_stories boolean DEFAULT false;

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_slug text REFERENCES locations(slug) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  end_date date,
  cta_label text,
  cta_url text,
  image_url text,
  is_active boolean DEFAULT true,
  is_corporate_template boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Instructors
CREATE TABLE IF NOT EXISTS instructors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_slug text NOT NULL REFERENCES locations(slug) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  bio text,
  certifications text,
  specialties text,
  photo_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Programs
CREATE TABLE IF NOT EXISTS programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_slug text REFERENCES locations(slug) ON DELETE CASCADE,
  name text NOT NULL,
  duration text,
  description text,
  whats_included text,
  cta_label text,
  cta_url text,
  image_url text,
  is_active boolean DEFAULT true,
  is_corporate_template boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Success Stories
CREATE TABLE IF NOT EXISTS success_stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_slug text NOT NULL REFERENCES locations(slug) ON DELETE CASCADE,
  member_name text NOT NULL,
  program_name text,
  story text,
  result_stat text,
  before_image_url text,
  after_image_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_location_slug ON events(location_slug);
CREATE INDEX IF NOT EXISTS idx_events_active_date ON events(is_active, event_date);
CREATE INDEX IF NOT EXISTS idx_instructors_location_slug ON instructors(location_slug);
CREATE INDEX IF NOT EXISTS idx_programs_location_slug ON programs(location_slug);
CREATE INDEX IF NOT EXISTS idx_success_stories_location_slug ON success_stories(location_slug);

-- RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read instructors" ON instructors FOR SELECT USING (true);
CREATE POLICY "Public read programs" ON programs FOR SELECT USING (true);
CREATE POLICY "Public read success_stories" ON success_stories FOR SELECT USING (true);

CREATE POLICY "Auth write events" ON events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write instructors" ON instructors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write programs" ON programs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write success_stories" ON success_stories FOR ALL USING (auth.role() = 'authenticated');

-- Supabase Storage bucket for instructor and success story photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-media', 'location-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read location-media"
  ON storage.objects FOR SELECT USING (bucket_id = 'location-media');

CREATE POLICY "Auth upload location-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'location-media' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete location-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'location-media' AND auth.role() = 'authenticated');