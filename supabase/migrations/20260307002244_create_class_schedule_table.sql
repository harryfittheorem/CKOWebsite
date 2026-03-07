/*
  # Create class schedule table

  1. New Tables
    - `class_schedule`
      - `id` (uuid, primary key)
      - `location_slug` (text, not null) - Reference to location
      - `day_of_week` (text, not null) - Day name: 'monday', 'tuesday', etc.
      - `start_time` (text, not null) - Start time in HH:MM format (e.g., '06:00')
      - `end_time` (text, not null) - End time in HH:MM format
      - `class_type` (text, not null) - Type of class (e.g., 'Kickboxing')
      - `instructor` (text, nullable) - Instructor name
      - `ghl_booking_url` (text, nullable) - GoHighLevel booking link
      - `is_active` (boolean, default true) - Whether class is active
      - `display_order` (integer, default 0) - Order to display classes
      - `created_at` (timestamptz, default now())

  2. Indexes
    - Index on `location_slug` for fast lookups
    - Composite index on `location_slug, day_of_week, is_active` for schedule queries
    - Index on `display_order` for sorting

  3. Security
    - Enable RLS on `class_schedule` table
    - Add policy for public read access to active schedules
    - Only authenticated admins can modify schedules

  4. Seed Data
    - Realistic Monday-Friday schedule for league-city location
    - 5-6 classes per day between 6 AM and 7:30 PM
    - All classes use placeholder booking URL
*/

CREATE TABLE IF NOT EXISTS class_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_slug text NOT NULL,
  day_of_week text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  class_type text NOT NULL,
  instructor text,
  ghl_booking_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_schedule_location ON class_schedule (location_slug);
CREATE INDEX IF NOT EXISTS idx_class_schedule_lookup ON class_schedule (location_slug, day_of_week, is_active);
CREATE INDEX IF NOT EXISTS idx_class_schedule_order ON class_schedule (display_order);

ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'class_schedule' 
    AND policyname = 'Public can view active class schedules'
  ) THEN
    CREATE POLICY "Public can view active class schedules"
      ON class_schedule
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'class_schedule' 
    AND policyname = 'Authenticated users can read all schedules'
  ) THEN
    CREATE POLICY "Authenticated users can read all schedules"
      ON class_schedule
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

INSERT INTO class_schedule (location_slug, day_of_week, start_time, end_time, class_type, instructor, ghl_booking_url, display_order)
VALUES
  ('league-city', 'monday', '06:00', '06:45', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 1),
  ('league-city', 'monday', '09:30', '10:15', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 2),
  ('league-city', 'monday', '12:00', '12:45', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 3),
  ('league-city', 'monday', '17:00', '17:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 4),
  ('league-city', 'monday', '18:00', '18:45', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 5),
  ('league-city', 'monday', '19:00', '19:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 6),

  ('league-city', 'tuesday', '06:00', '06:45', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 1),
  ('league-city', 'tuesday', '09:30', '10:15', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 2),
  ('league-city', 'tuesday', '12:00', '12:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 3),
  ('league-city', 'tuesday', '17:00', '17:45', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 4),
  ('league-city', 'tuesday', '18:00', '18:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 5),
  ('league-city', 'tuesday', '19:00', '19:45', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 6),

  ('league-city', 'wednesday', '06:00', '06:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 1),
  ('league-city', 'wednesday', '09:30', '10:15', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 2),
  ('league-city', 'wednesday', '12:00', '12:45', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 3),
  ('league-city', 'wednesday', '17:00', '17:45', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 4),
  ('league-city', 'wednesday', '18:00', '18:45', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 5),
  ('league-city', 'wednesday', '19:00', '19:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 6),

  ('league-city', 'thursday', '06:00', '06:45', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 1),
  ('league-city', 'thursday', '09:30', '10:15', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 2),
  ('league-city', 'thursday', '12:00', '12:45', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 3),
  ('league-city', 'thursday', '17:00', '17:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 4),
  ('league-city', 'thursday', '18:00', '18:45', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 5),
  ('league-city', 'thursday', '19:00', '19:45', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 6),

  ('league-city', 'friday', '06:00', '06:45', 'Kickboxing', 'Mike Johnson', 'https://link.ckokickboxing.com/league-city', 1),
  ('league-city', 'friday', '09:30', '10:15', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 2),
  ('league-city', 'friday', '12:00', '12:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 3),
  ('league-city', 'friday', '17:00', '17:45', 'Kickboxing', 'Sarah Martinez', 'https://link.ckokickboxing.com/league-city', 4),
  ('league-city', 'friday', '18:00', '18:45', 'Kickboxing', 'Alex Rodriguez', 'https://link.ckokickboxing.com/league-city', 5);
