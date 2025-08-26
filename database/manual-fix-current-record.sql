-- Manually fix the current record while we debug the trigger
UPDATE mail_packages 
SET s3_key = '20250826_125717_1.jpg'
WHERE id = 'db00ffdf-ef0c-47ba-8d15-7cef701a54ef';

-- Verify the fix
SELECT 
  id,
  s3_key,
  updated_at
FROM mail_packages 
WHERE id = 'db00ffdf-ef0c-47ba-8d15-7cef701a54ef';
