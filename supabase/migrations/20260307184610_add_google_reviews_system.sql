/*
  # Add Google Reviews Import System

  1. Changes
    - Make `location_slug` nullable to support corporate defaults
    - Add `is_corporate_default` column to testimonials table
    - Insert 5 corporate fallback testimonials with NULL location_slug
  
  2. Corporate Default Testimonials
    - These serve as fallback content when a location has no Google reviews
    - Identified by `is_corporate_default = true` and `location_slug IS NULL`
    - Display_order determines which ones show first (1-5)
    - All set to active and 5-star rating
  
  3. Purpose
    - Ensures every location page has testimonials content
    - Provides quality fallback content while Google reviews are being imported
    - Corporate defaults never get overwritten by import process
*/

-- Make location_slug nullable to support corporate defaults
ALTER TABLE testimonials 
ALTER COLUMN location_slug DROP NOT NULL;

-- Add is_corporate_default column to testimonials
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS is_corporate_default boolean DEFAULT false;

-- Insert 5 corporate default fallback testimonials (location_slug = NULL)
INSERT INTO testimonials 
  (location_slug, member_name, member_since, quote, rating, 
   display_order, is_active, is_corporate_default)
VALUES
  (NULL, 'Sarah M.', 'Member since 2022',
   'I''ve tried every gym in town and nothing comes close to CKO. The energy in class is unlike anything else — you forget you''re even working out. I''ve lost 28 pounds and I actually look forward to coming in.',
   5, 1, true, true),
  (NULL, 'James T.', 'Member since 2021',
   'As someone who was completely out of shape and intimidated by gyms, CKO was a game changer. The instructors meet you where you are. Six months in and I''m in the best shape of my life.',
   5, 2, true, true),
  (NULL, 'Maria R.', 'Member since 2023',
   'The community here is what keeps me coming back. Everyone cheers each other on regardless of fitness level. Plus hitting a heavy bag is the best stress relief I''ve ever found — better than therapy!',
   5, 3, true, true),
  (NULL, 'David K.', 'Member since 2020',
   'Four years strong at CKO. I''ve watched my endurance, strength, and confidence go through the roof. The classes never get old because no two are the same. Best fitness investment I''ve ever made.',
   5, 4, true, true),
  (NULL, 'Ashley W.', 'Member since 2023',
   'Came for a free class and never left. Three months in I''m down 15 pounds and my arms have never looked better. The instructors actually know your name and push you just the right amount.',
   5, 5, true, true);