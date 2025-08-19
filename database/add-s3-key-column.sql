-- Add s3_key column to existing mail_packages table
-- Run this before running update-mail-packages-s3-key.sql

ALTER TABLE mail_packages 
ADD COLUMN IF NOT EXISTS s3_key TEXT;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'mail_packages' 
AND column_name = 's3_key'; 