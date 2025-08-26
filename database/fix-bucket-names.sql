-- Fix bucket names in mail_scans table
-- Update all records to use the correct 'andyscan' bucket instead of 'survey-mail-scans'

UPDATE mail_scans 
SET s3_bucket_name = 'andyscan'
WHERE s3_bucket_name = 'survey-mail-scans';

-- Verify the update
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN s3_bucket_name = 'andyscan' THEN 1 END) as correct_bucket,
  COUNT(CASE WHEN s3_bucket_name = 'survey-mail-scans' THEN 1 END) as wrong_bucket,
  COUNT(CASE WHEN s3_bucket_name NOT IN ('andyscan', 'survey-mail-scans') THEN 1 END) as other_buckets
FROM mail_scans;

-- Show sample records to verify
SELECT 
  id,
  s3_bucket_name,
  s3_key,
  image_filename,
  created_at
FROM mail_scans 
ORDER BY created_at DESC 
LIMIT 5;
