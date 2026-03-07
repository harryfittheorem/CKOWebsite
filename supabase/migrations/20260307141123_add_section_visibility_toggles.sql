/*
  # Add Section Visibility Toggles

  1. Changes
    - Add boolean columns to locations table for controlling section visibility
    - All columns default to true (sections visible by default)
    - Franchisees and admins can toggle sections on/off per location

  2. New Columns
    - `show_schedule` (boolean, default true) - Controls class schedule section visibility
    - `show_memberships` (boolean, default true) - Controls membership packages section visibility
    - `show_programs` (boolean, default true) - Controls programs section visibility
    - `show_testimonials` (boolean, default true) - Controls testimonials section visibility
    - `show_map` (boolean, default true) - Controls Google Maps section visibility
    - `show_contact_form` (boolean, default true) - Controls contact form section visibility
    - `show_gallery` (boolean, default true) - Controls photo gallery section visibility

  3. Important Notes
    - Sections are visible by default (true)
    - Only explicit false value hides a section
    - Null values also show the section (backward compatible)
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='show_schedule') THEN
    ALTER TABLE locations ADD COLUMN show_schedule boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='show_memberships') THEN
    ALTER TABLE locations ADD COLUMN show_memberships boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='show_programs') THEN
    ALTER TABLE locations ADD COLUMN show_programs boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='show_testimonials') THEN
    ALTER TABLE locations ADD COLUMN show_testimonials boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='show_map') THEN
    ALTER TABLE locations ADD COLUMN show_map boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='show_contact_form') THEN
    ALTER TABLE locations ADD COLUMN show_contact_form boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='show_gallery') THEN
    ALTER TABLE locations ADD COLUMN show_gallery boolean DEFAULT true;
  END IF;
END $$;
