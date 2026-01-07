/*
  # Create Referrals Tracking System

  1. New Tables
    - `referrals`
      - `id` (uuid, primary key) - Unique identifier for each referral
      - `referral_code` (text, unique, indexed) - Unique code for sharing (8-character alphanumeric)
      - `referrer_name` (text) - Name of the person making the referral
      - `referrer_email` (text) - Email of the referrer
      - `referrer_phone` (text) - Phone number of the referrer
      - `friend_name` (text, nullable) - Name of the referred friend (filled when they book)
      - `friend_email` (text, nullable) - Email of the referred friend
      - `friend_phone` (text, nullable) - Phone of the referred friend
      - `status` (text, default 'pending') - Status: 'pending', 'completed'
      - `created_at` (timestamptz) - When the referral was created
      - `completed_at` (timestamptz, nullable) - When the friend completed their booking
      - `location` (text, nullable) - Selected location for the referral
      - `class_type` (text, nullable) - Type of class interested in

  2. Security
    - Enable RLS on `referrals` table
    - Add policy for public read access (needed for referral landing page)
    - Add policy for public insert access (needed for creating referrals and completions)
    - Add policy for public update access (needed for completing referrals)

  3. Indexes
    - Create index on `referral_code` for fast lookups
    - Create index on `referrer_email` for tracking user's referrals
*/

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text UNIQUE NOT NULL,
  referrer_name text NOT NULL,
  referrer_email text NOT NULL,
  referrer_phone text NOT NULL,
  friend_name text,
  friend_email text,
  friend_phone text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  location text,
  class_type text,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read referrals (needed for referral landing page to fetch referrer info)
CREATE POLICY "Anyone can read referrals"
  ON referrals FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert referrals (needed when someone completes the initial form)
CREATE POLICY "Anyone can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update referrals (needed when friend completes their booking)
CREATE POLICY "Anyone can update referrals"
  ON referrals FOR UPDATE
  USING (true)
  WITH CHECK (true);