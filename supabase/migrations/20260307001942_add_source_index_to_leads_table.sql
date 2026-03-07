/*
  # Add source index to leads table

  1. Index Addition
    - Adds an index on the `source` column in the `leads` table if it doesn't already exist
    - This improves query performance when filtering or grouping leads by source
    - Uses IF NOT EXISTS to prevent errors if the index already exists

  2. Purpose
    - Optimize queries that filter leads by source (e.g., 'homepage-hero-ip', 'location-hero-league-city')
    - Support analytics and reporting on lead sources
*/

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads (source);