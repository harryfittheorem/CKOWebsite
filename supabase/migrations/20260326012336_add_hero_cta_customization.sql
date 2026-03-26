/*
  # Add Hero CTA Customization Fields

  1. Changes
    - Add `hero_cta_label` column to `locations` table
      - Text field for customizing the main CTA button text (e.g., "Claim My Free Class", "Book 2 Classes for $40")
      - Defaults to "Claim My Free Class"
    
    - Add `hero_cta_subtext` column to `locations` table
      - Text field for customizing the subtext below the CTA (e.g., "First class free", "Includes gloves")
      - Defaults to "First class is completely free"

  2. Purpose
    - Allow per-location customization of hero section CTA messaging
    - Enable franchisees to tailor promotional offers to their local market
*/

-- Add hero CTA label column
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS hero_cta_label text DEFAULT 'Claim My Free Class';

-- Add hero CTA subtext column
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS hero_cta_subtext text DEFAULT 'First class is completely free';
