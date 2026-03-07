/*
  # Add Lat/Lng Index for Location Search Performance

  1. Performance Optimization
    - Creates a composite index on `lat` and `lng` columns
    - Filtered to only include active locations
    - Enables fast bounding box queries for geolocation search
    - Significantly improves query performance when filtering by coordinate ranges

  2. Notes
    - Uses partial index (WHERE is_active = true) to reduce index size
    - Supports efficient range queries on latitude and longitude
    - Critical for homepage hero location search performance
*/

CREATE INDEX IF NOT EXISTS idx_locations_lat_lng
  ON locations(lat, lng)
  WHERE is_active = true;