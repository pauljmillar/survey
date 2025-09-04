-- Add all missing columns to mail_packages table
-- This migration adds the columns needed for the PATCH API specification

-- Add the missing columns
ALTER TABLE mail_packages 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS processing_notes TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS company_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS response_intention TEXT,
ADD COLUMN IF NOT EXISTS name_check TEXT;

-- Add comments for documentation
COMMENT ON COLUMN mail_packages.notes IS 'General notes for the mail package (different from processing_notes)';
COMMENT ON COLUMN mail_packages.processing_notes IS 'Admin notes, AI analysis results, etc.';
COMMENT ON COLUMN mail_packages.industry IS 'Industry category for the mail package';
COMMENT ON COLUMN mail_packages.brand_name IS 'Brand name for the mail package';
COMMENT ON COLUMN mail_packages.company_validated IS 'Whether the company/brand has been validated';
COMMENT ON COLUMN mail_packages.response_intention IS 'User response intention for this mail package';
COMMENT ON COLUMN mail_packages.name_check IS 'Name validation check result';

-- Verify all columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'mail_packages' 
AND column_name IN ('notes', 'processing_notes', 'industry', 'brand_name', 'company_validated', 'response_intention', 'name_check')
ORDER BY column_name;
