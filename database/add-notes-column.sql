-- Add notes column to mail_packages table
-- This column is needed for the PATCH API specification

ALTER TABLE mail_packages 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN mail_packages.notes IS 'General notes for the mail package (different from processing_notes)';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'mail_packages' 
AND column_name = 'notes';
