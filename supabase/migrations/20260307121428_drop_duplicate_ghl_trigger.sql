/*
  # Drop Duplicate GHL Trigger

  1. Changes
    - Drop the pg_net database trigger on leads table
    - Drop the trigger function that calls GHL edge function
  
  2. Reason
    - The Supabase dashboard webhook is already configured and working
    - Having both the pg_net trigger and dashboard webhook causes duplicate contacts in GHL
    - This removes the redundant pg_net trigger to prevent double-firing
*/

DROP TRIGGER IF EXISTS on_lead_insert_call_ghl ON leads;
DROP FUNCTION IF EXISTS trigger_ghl_create_contact();