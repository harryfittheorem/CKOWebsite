/*
  # Add Packages RLS Policies

  1. Changes
    - Drop existing policies on packages table
    - Add role-based policies for admins and franchisees
    - Admins can manage all packages
    - Franchisees can only manage packages for their assigned location

  2. Security
    - Public can view active packages
    - Authenticated users must have appropriate role and location access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active packages" ON packages;
DROP POLICY IF EXISTS "Authenticated users can insert packages" ON packages;
DROP POLICY IF EXISTS "Authenticated users can update packages" ON packages;
DROP POLICY IF EXISTS "Authenticated users can delete packages" ON packages;

-- Public can view active packages
CREATE POLICY "Anyone can view active packages"
  ON packages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins can manage all packages
CREATE POLICY "Admins can manage all packages"
  ON packages FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Franchisees can manage own location packages
CREATE POLICY "Franchisees can manage own location packages"
  ON packages FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = packages.location_slug)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'franchisee' AND location_slug = packages.location_slug)
  );
