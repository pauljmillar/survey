-- Fix mail_packages s3_key values to include proper extensions and sequence numbers
-- This script will update existing records and improve the trigger function

-- First, let's see what we're working with
SELECT 
  mp.id as package_id,
  mp.s3_key as package_s3_key,
  ms.s3_key as scan_s3_key,
  ms.image_sequence,
  ms.created_at as scan_created
FROM mail_packages mp
LEFT JOIN mail_scans ms ON mp.id = ms.mailpack_id AND ms.image_sequence = 1
WHERE mp.s3_key IS NOT NULL
ORDER BY mp.created_at DESC
LIMIT 10;

-- Update all mail_packages to have the correct s3_key from their first mail_scan
UPDATE mail_packages 
SET s3_key = (
  SELECT s3_key 
  FROM mail_scans 
  WHERE mailpack_id = mail_packages.id 
  AND image_sequence = 1
  LIMIT 1
)
WHERE s3_key IS NOT NULL 
AND EXISTS (
  SELECT 1 
  FROM mail_scans 
  WHERE mailpack_id = mail_packages.id 
  AND image_sequence = 1
);

-- Verify the updates
SELECT 
  mp.id as package_id,
  mp.s3_key as package_s3_key,
  ms.s3_key as scan_s3_key,
  ms.image_sequence
FROM mail_packages mp
LEFT JOIN mail_scans ms ON mp.id = ms.mailpack_id AND ms.image_sequence = 1
WHERE mp.s3_key IS NOT NULL
ORDER BY mp.created_at DESC
LIMIT 10;

-- Improve the trigger function to handle both INSERT and UPDATE
CREATE OR REPLACE FUNCTION update_mail_package_s3_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the mail_package s3_key with the first image's s3_key
  UPDATE mail_packages 
  SET s3_key = (
    SELECT s3_key 
    FROM mail_scans 
    WHERE mailpack_id = NEW.mailpack_id 
    AND image_sequence = 1
    LIMIT 1
  )
  WHERE id = NEW.mailpack_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and recreate it to fire on both INSERT and UPDATE
DROP TRIGGER IF EXISTS update_mail_package_s3_key_trigger ON mail_scans;
CREATE TRIGGER update_mail_package_s3_key_trigger
  AFTER INSERT OR UPDATE ON mail_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_mail_package_s3_key();

-- Also create a trigger on mail_packages to ensure s3_key is set when package is created
CREATE OR REPLACE FUNCTION ensure_mail_package_s3_key()
RETURNS TRIGGER AS $$
BEGIN
  -- If s3_key is not set, try to get it from the first mail_scan
  IF NEW.s3_key IS NULL OR NEW.s3_key = '' THEN
    NEW.s3_key = (
      SELECT s3_key 
      FROM mail_scans 
      WHERE mailpack_id = NEW.id 
      AND image_sequence = 1
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then recreate it
DROP TRIGGER IF EXISTS ensure_mail_package_s3_key_trigger ON mail_packages;
CREATE TRIGGER ensure_mail_package_s3_key_trigger
  BEFORE INSERT OR UPDATE ON mail_packages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_mail_package_s3_key();
