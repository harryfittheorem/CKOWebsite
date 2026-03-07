/*
  # Add Theme and Custom Template Columns

  1. Changes
    - Add theme customization column (jsonb)
    - Add custom template support column (text)
    - These allow per-location design customization

  2. Notes
    - theme stores JSON with color, style overrides
    - custom_template allows HTML override (future feature)
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='theme') THEN
    ALTER TABLE locations ADD COLUMN theme jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='custom_template') THEN
    ALTER TABLE locations ADD COLUMN custom_template text;
  END IF;
END $$;
