/*
  # Add unique constraint to testimonials table

  1. Changes
    - Remove duplicate testimonials (keeping the most recent one per location/member)
    - Add unique index on (location_slug, member_name) for non-corporate testimonials
    - This prevents duplicate reviews from the same member for a specific location
  
  2. Security
    - No RLS changes needed
  
  3. Notes
    - The WHERE clause excludes corporate defaults from the constraint
    - This allows the same corporate testimonial to appear as a fallback for multiple locations
    - Duplicates are cleaned up before applying the constraint
*/

-- Step 1: Remove duplicate testimonials, keeping only the most recent one
DELETE FROM testimonials
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY location_slug, member_name
             ORDER BY created_at DESC
           ) as rn
    FROM testimonials
    WHERE is_corporate_default = false
  ) t
  WHERE t.rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_unique_review
ON testimonials (location_slug, member_name)
WHERE is_corporate_default = false;
