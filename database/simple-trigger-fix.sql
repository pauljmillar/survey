-- Simple fix: Add SECURITY DEFINER to bypass RLS issues
-- This is the only change needed to make the trigger work properly

-- Recreate the trigger function with SECURITY DEFINER
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the trigger with the recent record
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
