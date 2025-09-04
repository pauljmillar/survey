-- Comprehensive fix for all mail_packages table issues
-- This migration addresses the PATCH API failures

-- 1. Add all missing columns needed for the PATCH API
ALTER TABLE mail_packages 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS processing_notes TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS company_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS response_intention TEXT,
ADD COLUMN IF NOT EXISTS name_check TEXT;

-- 2. Fix the status constraint to include all statuses used in the application
ALTER TABLE mail_packages DROP CONSTRAINT IF EXISTS mail_packages_status_check;

ALTER TABLE mail_packages ADD CONSTRAINT mail_packages_status_check 
CHECK (status IN ('pending', 'incomplete', 'processing', 'completed', 'rejected'));

-- 3. Add comments for documentation
COMMENT ON COLUMN mail_packages.notes IS 'General notes for the mail package (different from processing_notes)';
COMMENT ON COLUMN mail_packages.processing_notes IS 'Admin notes, AI analysis results, etc.';
COMMENT ON COLUMN mail_packages.industry IS 'Industry category for the mail package';
COMMENT ON COLUMN mail_packages.brand_name IS 'Brand name for the mail package';
COMMENT ON COLUMN mail_packages.company_validated IS 'Whether the company/brand has been validated';
COMMENT ON COLUMN mail_packages.response_intention IS 'User response intention for this mail package';
COMMENT ON COLUMN mail_packages.name_check IS 'Name validation check result';

-- 4. Verify all changes were applied
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'mail_packages' 
AND column_name IN ('notes', 'processing_notes', 'industry', 'brand_name', 'company_validated', 'response_intention', 'name_check')
ORDER BY column_name;

-- 5. Verify the status constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'mail_packages'::regclass 
AND contype = 'c';
