-- Debug the trigger function to see why it's not updating mail_packages.s3_key

-- First, let's check if the trigger exists and is enabled
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_mail_package_s3_key_trigger';

-- Check the current state
SELECT 
  'mail_packages' as table_name,
  id,
  s3_key,
  created_at
FROM mail_packages 
WHERE id = 'db00ffdf-ef0c-47ba-8d15-7cef701a54ef'

UNION ALL

SELECT 
  'mail_scans' as table_name,
  mailpack_id as id,
  s3_key,
  created_at
FROM mail_scans 
WHERE mailpack_id = 'db00ffdf-ef0c-47ba-8d15-7cef701a54ef'
ORDER BY image_sequence;

-- Test the trigger function logic manually
SELECT 
  'Manual trigger test' as test_type,
  mp.id as package_id,
  mp.s3_key as current_package_s3_key,
  ms.s3_key as should_be_s3_key,
  ms.image_sequence
FROM mail_packages mp
LEFT JOIN mail_scans ms ON mp.id = ms.mailpack_id AND ms.image_sequence = 1
WHERE mp.id = 'db00ffdf-ef0c-47ba-8d15-7cef701a54ef';

-- Check if there are any errors in the trigger function
-- Let's recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION update_mail_package_s3_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Add debug logging
  RAISE NOTICE 'Trigger fired for mailpack_id: %, s3_key: %', NEW.mailpack_id, NEW.s3_key;
  
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
  
  -- Log the result
  RAISE NOTICE 'Updated mail_package % with s3_key from scan', NEW.mailpack_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_mail_package_s3_key_trigger ON mail_scans;
CREATE TRIGGER update_mail_package_s3_key_trigger
  AFTER INSERT OR UPDATE ON mail_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_mail_package_s3_key();

-- Now let's manually trigger it by updating one of the mail_scans records
UPDATE mail_scans 
SET updated_at = NOW()
WHERE id = '41477abd-f9b9-4fd6-9d54-302552231601';

-- Check if the mail_package was updated
SELECT 
  'After trigger test' as status,
  id,
  s3_key,
  updated_at
FROM mail_packages 
WHERE id = 'db00ffdf-ef0c-47ba-8d15-7cef701a54ef';
