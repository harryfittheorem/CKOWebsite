/*
  # Add User Registration Policies

  1. Changes
    - Add INSERT policy for user_profiles to allow users to create their own profile during registration
    - Add INSERT policy for user_locations to allow users to link themselves to locations during registration
  
  2. Security
    - Users can only insert their own profile (auth.uid() = id)
    - Users can only link themselves to locations (auth.uid() = user_id)
*/

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to link themselves to locations
CREATE POLICY "Users can link own locations"
  ON user_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own location links
CREATE POLICY "Users can read own location links"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
