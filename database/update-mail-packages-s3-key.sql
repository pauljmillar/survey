-- Update existing mail_packages with s3_key from their first image
UPDATE mail_packages 
SET s3_key = (
  SELECT s3_key 
  FROM mail_scans 
  WHERE mailpack_id = mail_packages.id 
  AND image_sequence = 1
  LIMIT 1
)
WHERE s3_key IS NULL;

-- Verify the update
SELECT 
  mp.id,
  mp.s3_key,
  ms.s3_key as first_scan_s3_key,
  ms.image_sequence
FROM mail_packages mp
LEFT JOIN mail_scans ms ON ms.mailpack_id = mp.id AND ms.image_sequence = 1
LIMIT 10; 