/*
  # Add User Roles and RLS Policies

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text, not null, default 'franchisee') - Either 'admin' or 'franchisee'
      - `location_slug` (text, nullable, references locations) - Assigned location for franchisees
      - `created_at` (timestamptz, default now())

  2. Security Changes
    - Enable RLS on user_profiles
    - Add policy for users to read their own profile
    - Update leads table policies to scope by role (admins see all, franchisees see only their location)
    - Update locations table policies to scope by role (admins manage all, franchisees update only their location)
    - Update class_schedule, location_media, packages, and testimonials policies for franchisee scoping

  3. Important Notes
    - Admins can view and manage all data
    - Franchisees can only view and manage data for their assigned location
    - User profiles are created per Supabase Auth user
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'franchisee' CHECK (role IN ('admin', 'franchisee')),
  location_slug text REFERENCES locations(slug) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Update leads table RLS policies
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON leads;

CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can view own location leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = leads.location_slug)
  );

CREATE POLICY "Admins can insert all leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can insert own location leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = leads.location_slug)
  );

CREATE POLICY "Admins can update all leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can update own location leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = leads.location_slug)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = leads.location_slug)
  );

CREATE POLICY "Admins can delete all leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can delete own location leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = leads.location_slug)
  );

-- Update locations table RLS policies
DROP POLICY IF EXISTS "Anyone can view active locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can manage locations" ON locations;

CREATE POLICY "Anyone can view active locations"
  ON locations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all locations"
  ON locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can view own location"
  ON locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = locations.slug)
  );

CREATE POLICY "Admins can insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can update own location"
  ON locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = locations.slug)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = locations.slug)
  );

CREATE POLICY "Admins can delete locations"
  ON locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update class_schedule table RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert class schedule" ON class_schedule;
DROP POLICY IF EXISTS "Authenticated users can update class schedule" ON class_schedule;
DROP POLICY IF EXISTS "Authenticated users can delete class schedule" ON class_schedule;

CREATE POLICY "Admins can manage all class schedules"
  ON class_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can manage own location schedules"
  ON class_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = class_schedule.location_slug)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = class_schedule.location_slug)
  );

-- Update location_media table RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert location media" ON location_media;
DROP POLICY IF EXISTS "Authenticated users can update location media" ON location_media;
DROP POLICY IF EXISTS "Authenticated users can delete location media" ON location_media;

CREATE POLICY "Admins can manage all location media"
  ON location_media FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can manage own location media"
  ON location_media FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = location_media.location_slug)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = location_media.location_slug)
  );

-- Update testimonials table RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert testimonials" ON testimonials;
DROP POLICY IF EXISTS "Authenticated users can update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Authenticated users can delete testimonials" ON testimonials;

CREATE POLICY "Admins can manage all testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Franchisees can manage own location testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = testimonials.location_slug)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = testimonials.location_slug)
  );
