/*
  # ClubReady Payment Integration Schema

  ## Overview
  Creates database tables to support ClubReady payment processing integration for CKO Kickboxing checkout system.

  ## New Tables
  
  ### 1. `prospects`
  Stores customer information synced with ClubReady prospects
  - `id` (uuid, primary key) - Internal unique identifier
  - `clubready_user_id` (text, unique) - ClubReady prospect ID
  - `email` (text, unique) - Customer email address
  - `phone` (text) - Customer phone number
  - `first_name` (text) - Customer first name
  - `last_name` (text) - Customer last name
  - `date_of_birth` (date, nullable) - Customer birth date
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `last_synced_at` (timestamptz, nullable) - Last sync with ClubReady

  ### 2. `packages`
  Stores ClubReady package information for display and selection
  - `id` (uuid, primary key) - Internal unique identifier
  - `clubready_package_id` (text, unique) - ClubReady package ID
  - `name` (text) - Package name
  - `description` (text, nullable) - Package description
  - `price` (numeric) - Package price in dollars
  - `duration_months` (integer) - Package duration in months
  - `is_active` (boolean) - Whether package is currently available
  - `display_order` (integer) - Sort order for display
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `transactions`
  Records all payment transactions processed through ClubReady
  - `id` (uuid, primary key) - Internal unique identifier
  - `prospect_id` (uuid, foreign key) - Reference to prospects table
  - `clubready_transaction_id` (text, unique, nullable) - ClubReady transaction ID
  - `package_id` (uuid, foreign key) - Reference to packages table
  - `amount` (numeric) - Transaction amount
  - `status` (text) - Transaction status (pending, completed, failed, refunded)
  - `payment_method` (text) - Payment method type
  - `last_four` (text, nullable) - Last 4 digits of card
  - `error_message` (text, nullable) - Error details if failed
  - `metadata` (jsonb, nullable) - Additional transaction data
  - `created_at` (timestamptz) - Transaction creation timestamp
  - `completed_at` (timestamptz, nullable) - Transaction completion timestamp

  ### 4. `payment_logs`
  Logs all ClubReady API interactions for debugging and auditing
  - `id` (uuid, primary key) - Internal unique identifier
  - `transaction_id` (uuid, foreign key, nullable) - Associated transaction
  - `endpoint` (text) - ClubReady API endpoint called
  - `request_data` (jsonb, nullable) - Request payload (sensitive data excluded)
  - `response_data` (jsonb, nullable) - Response data
  - `status_code` (integer, nullable) - HTTP status code
  - `error_message` (text, nullable) - Error message if failed
  - `duration_ms` (integer, nullable) - Request duration in milliseconds
  - `created_at` (timestamptz) - Log entry timestamp

  ## Security
  - Enable RLS on all tables
  - Add restrictive policies for authenticated access only
  - Sensitive payment data is never stored in raw form

  ## Indexes
  - Indexed email and phone fields for fast prospect lookups
  - Indexed clubready_user_id for sync operations
  - Indexed transaction status and dates for reporting
*/

-- Create prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clubready_user_id text UNIQUE,
  email text UNIQUE NOT NULL,
  phone text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_synced_at timestamptz
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clubready_package_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  duration_months integer DEFAULT 1,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  clubready_transaction_id text UNIQUE,
  package_id uuid REFERENCES packages(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  last_four text,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Create payment_logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  request_data jsonb,
  response_data jsonb,
  status_code integer,
  error_message text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
CREATE INDEX IF NOT EXISTS idx_prospects_phone ON prospects(phone);
CREATE INDEX IF NOT EXISTS idx_prospects_clubready_id ON prospects(clubready_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_prospect_id ON transactions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prospects
CREATE POLICY "Prospects are viewable by authenticated users"
  ON prospects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Prospects can be inserted by authenticated users"
  ON prospects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Prospects can be updated by authenticated users"
  ON prospects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for packages (publicly viewable for checkout)
CREATE POLICY "Packages are viewable by everyone"
  ON packages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Packages can be managed by authenticated users"
  ON packages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for transactions
CREATE POLICY "Transactions are viewable by authenticated users"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Transactions can be created by authenticated users"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Transactions can be updated by authenticated users"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payment_logs
CREATE POLICY "Payment logs are viewable by authenticated users"
  ON payment_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Payment logs can be created by authenticated users"
  ON payment_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_prospects_updated_at ON prospects;
CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();