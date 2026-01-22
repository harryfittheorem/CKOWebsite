/*
  # Enhance Payment Logs for Better Debugging

  1. Changes
    - Add `request_headers` column to store full request headers
    - Add `request_body` column to store the complete request payload
    - Add `api_endpoint` column to track which API endpoint was called
    - Add `api_url` column to store the full URL used
    - Add `http_status` column to store HTTP status code
    - Add `error_details` column for detailed error information
    - Add `clubready_request_id` column to track ClubReady's request IDs
    - Add `step` column to identify which step failed (search/create/payment)

  2. Purpose
    - Enable comprehensive debugging of ClubReady API issues
    - Track exact requests and responses for troubleshooting
    - Identify patterns in API failures
    - Store authentication and header information securely
*/

-- Add new debugging columns to payment_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_logs' AND column_name = 'request_headers'
  ) THEN
    ALTER TABLE payment_logs ADD COLUMN request_headers jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_logs' AND column_name = 'request_body'
  ) THEN
    ALTER TABLE payment_logs ADD COLUMN request_body jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_logs' AND column_name = 'api_endpoint'
  ) THEN
    ALTER TABLE payment_logs ADD COLUMN api_endpoint text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_logs' AND column_name = 'api_url'
  ) THEN
    ALTER TABLE payment_logs ADD COLUMN api_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_logs' AND column_name = 'http_status'
  ) THEN
    ALTER TABLE payment_logs ADD COLUMN http_status integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_logs' AND column_name = 'error_details'
  ) THEN
    ALTER TABLE payment_logs ADD COLUMN error_details jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_logs' AND column_name = 'clubready_request_id'
  ) THEN
    ALTER TABLE payment_logs ADD COLUMN clubready_request_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_logs' AND column_name = 'step'
  ) THEN
    ALTER TABLE payment_logs ADD COLUMN step text;
  END IF;
END $$;

-- Add indexes for faster querying by step and status
CREATE INDEX IF NOT EXISTS idx_payment_logs_step ON payment_logs(step);
CREATE INDEX IF NOT EXISTS idx_payment_logs_http_status ON payment_logs(http_status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_endpoint ON payment_logs(endpoint);
