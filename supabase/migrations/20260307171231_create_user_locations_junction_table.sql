/*
  # Create User Locations Junction Table

  1. New Tables
    - `user_locations`
      - `user_id` (uuid, foreign key to auth.users)
      - `location_slug` (text, foreign key to locations)
      - `created_at` (timestamptz)
      - Composite primary key on (user_id, location_slug)
  
  2. Security
    - Enable RLS on `user_locations` table
    - Add policy for admins to manage all user-location relationships
    - Add policy for franchisees to view their own location assignments
  
  3. Changes
    - Supports many-to-many relationship between users and locations
    - Allows franchisee users to have access to multiple locations
    - Prevents duplicate assignments with unique constraint
*/

-- Create user_locations junction table
CREATE TABLE IF NOT EXISTS user_locations (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_slug text NOT NULL REFERENCES locations(slug) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, location_slug)
);

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all user-location relationships
CREATE POLICY "Admins can manage all user locations"
  ON user_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Users can view their own location assignments
CREATE POLICY "Users can view their own location assignments"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location_slug ON user_locations(location_slug);
