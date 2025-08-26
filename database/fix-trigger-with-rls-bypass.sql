-- Fix the trigger function to handle RLS and transaction issues
-- The trigger needs to run with elevated privileges to update mail_packages

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_mail_package_s3_key_trigger ON mail_scans;

-- Create a more robust trigger function
CREATE OR REPLACE FUNCTION update_mail_package_s3_key()
RETURNS TRIGGER AS $$
DECLARE
  first_scan_s3_key TEXT;
BEGIN
  -- Add debug logging
  RAISE NOTICE 'Trigger fired for mailpack_id: %, s3_key: %, operation: %', NEW.mailpack_id, NEW.s3_key, TG_OP;
  
  -- Get the first scan's s3_key for this mail package
  SELECT s3_key INTO first_scan_s3_key
  FROM mail_scans 
  WHERE mailpack_id = NEW.mailpack_id 
  AND image_sequence = 1
  LIMIT 1;
  
  -- Log what we found
  RAISE NOTICE 'Found first scan s3_key: % for mailpack_id: %', first_scan_s3_key, NEW.mailpack_id;
  
  -- Only update if we found a first scan and it's different from current
  IF first_scan_s3_key IS NOT NULL THEN
    -- Use SECURITY DEFINER to bypass RLS
    PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
    
    UPDATE mail_packages 
    SET s3_key = first_scan_s3_key
    WHERE id = NEW.mailpack_id;
    
    -- Log the result
    RAISE NOTICE 'Updated mail_package % with s3_key: %', NEW.mailpack_id, first_scan_s3_key;
  ELSE
    RAISE NOTICE 'No first scan found for mailpack_id: %', NEW.mailpack_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER update_mail_package_s3_key_trigger
  AFTER INSERT OR UPDATE ON mail_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_mail_package_s3_key();

-- Test the trigger with the recent records
-- First, let's see the current state
SELECT 
  'Current state' as status,
  mp.id as package_id,
  mp.s3_key as package_s3_key,
  ms.s3_key as first_scan_s3_key,
  ms.image_sequence
FROM mail_packages mp
LEFT JOIN mail_scans ms ON mp.id = ms.mailpack_id AND ms.image_sequence = 1
WHERE mp.id = 'deb599a5-fa5e-4b14-84ed-7b2ff4eb5128';

-- Manually trigger the update for the recent record
UPDATE mail_scans 
SET updated_at = NOW()
WHERE id = 'd5988e8b-49b9-4eba-afdd-d6f73865a597';

-- Check if it worked
SELECT 
  'After trigger test' as status,
  mp.id as package_id,
  mp.s3_key as package_s3_key,
  mp.updated_at
FROM mail_packages mp
WHERE mp.id = 'deb599a5-fa5e-4b14-84ed-7b2ff4eb5128';
