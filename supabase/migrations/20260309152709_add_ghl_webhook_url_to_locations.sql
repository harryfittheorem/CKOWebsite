/*
  # Add GHL Webhook URL to Locations

  1. Changes
    - Add `ghl_webhook_url` column to `locations` table
      - Type: text
      - Nullable: true
      - Used to store GoHighLevel webhook URLs for posting leads directly
  
  2. Notes
    - This replaces the API-based contact creation with webhook-based integration
    - Allows per-location webhook configuration for flexible GHL setup
*/

ALTER TABLE locations ADD COLUMN IF NOT EXISTS ghl_webhook_url text;
