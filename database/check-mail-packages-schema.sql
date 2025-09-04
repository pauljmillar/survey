-- Check the current schema of the mail_packages table
-- This will help identify what columns are missing

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'mail_packages' 
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mail_packages' AND column_name = 'processing_notes'
  ) THEN 'EXISTS' ELSE 'MISSING' END as processing_notes_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mail_packages' AND column_name = 'notes'
  ) THEN 'EXISTS' ELSE 'MISSING' END as notes_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mail_packages' AND column_name = 'industry'
  ) THEN 'EXISTS' ELSE 'MISSING' END as industry_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mail_packages' AND column_name = 'brand_name'
  ) THEN 'EXISTS' ELSE 'MISSING' END as brand_name_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mail_packages' AND column_name = 'company_validated'
  ) THEN 'EXISTS' ELSE 'MISSING' END as company_validated_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mail_packages' AND column_name = 'response_intention'
  ) THEN 'EXISTS' ELSE 'MISSING' END as response_intention_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mail_packages' AND column_name = 'name_check'
  ) THEN 'EXISTS' ELSE 'MISSING' END as name_check_status;
