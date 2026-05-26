-- Add university to societies
ALTER TABLE societies
  ADD COLUMN IF NOT EXISTS university text;

-- Add visibility filter to listings (null = visible to all universities)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS visible_to_universities text[];
