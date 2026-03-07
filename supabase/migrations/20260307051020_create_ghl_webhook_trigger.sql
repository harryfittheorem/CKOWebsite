/*
  # Create GoHighLevel Webhook Trigger

  1. Overview
    - Automatically pushes new leads to GoHighLevel when inserted into the leads table
    - Uses Supabase Edge Function to handle the GHL API integration

  2. Implementation
    - Creates a trigger function that calls the ghl-create-contact Edge Function
    - Trigger fires on INSERT operations to the leads table
    - Passes lead data as JSON payload to the Edge Function

  3. Security
    - Uses pg_net extension for secure HTTP calls
    - Function runs with security definer privileges
    - Edge Function handles authentication with GHL API key

  4. Important Notes
    - Requires pg_net extension to be enabled
    - Edge Function must be deployed before this migration runs
    - Webhook runs asynchronously and doesn't block INSERT operations
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to call the Edge Function when a lead is inserted
CREATE OR REPLACE FUNCTION trigger_ghl_create_contact()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  supabase_url text;
  supabase_anon_key text;
  request_id bigint;
BEGIN
  -- Get Supabase URL and anon key from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- If settings aren't available, construct URL from default
  IF supabase_url IS NULL THEN
    supabase_url := COALESCE(
      current_setting('request.header.origin', true),
      'http://localhost:54321'
    );
  END IF;

  -- Make async HTTP request to Edge Function
  SELECT INTO request_id net.http_post(
    url := supabase_url || '/functions/v1/ghl-create-contact',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(supabase_anon_key, '')
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', NULL
    )
  );

  -- Return NEW to allow the INSERT to complete
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_lead_insert_call_ghl ON leads;

-- Create trigger that fires after INSERT on leads table
CREATE TRIGGER on_lead_insert_call_ghl
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ghl_create_contact();
