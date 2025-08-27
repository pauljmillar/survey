-- Add new columns to mail_packages table
-- These columns will store data that's currently duplicated across mail_scans

-- Add the new columns
ALTER TABLE mail_packages 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS company_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS response_intention TEXT,
ADD COLUMN IF NOT EXISTS name_check TEXT;

-- Add comments for documentation
COMMENT ON COLUMN mail_packages.industry IS 'Industry category for the mail package (duplicated from mail_scans)';
COMMENT ON COLUMN mail_packages.brand_name IS 'Brand name for the mail package (duplicated from mail_scans)';
COMMENT ON COLUMN mail_packages.company_validated IS 'Whether the company/brand has been validated';
COMMENT ON COLUMN mail_packages.response_intention IS 'User response intention for this mail package';
COMMENT ON COLUMN mail_packages.name_check IS 'Name validation check result';

-- Create a function to update mail_packages with data from mail_scans
CREATE OR REPLACE FUNCTION update_mail_package_from_scans()
RETURNS TRIGGER AS $$
BEGIN
  -- Update mail_package with data from the first mail_scan
  UPDATE mail_packages 
  SET 
    industry = (
      SELECT industry 
      FROM mail_scans 
      WHERE mailpack_id = NEW.mailpack_id 
      AND image_sequence = 1
      LIMIT 1
    ),
    brand_name = (
      SELECT brand_name 
      FROM mail_scans 
      WHERE mailpack_id = NEW.mailpack_id 
      AND image_sequence = 1
      LIMIT 1
    )
  WHERE id = NEW.mailpack_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update mail_packages when mail_scans are inserted/updated
DROP TRIGGER IF EXISTS update_mail_package_from_scans_trigger ON mail_scans;
CREATE TRIGGER update_mail_package_from_scans_trigger
  AFTER INSERT OR UPDATE ON mail_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_mail_package_from_scans();

-- Update existing mail_packages with data from their mail_scans
UPDATE mail_packages 
SET 
  industry = (
    SELECT industry 
    FROM mail_scans 
    WHERE mailpack_id = mail_packages.id 
    AND image_sequence = 1
    LIMIT 1
  ),
  brand_name = (
    SELECT brand_name 
    FROM mail_scans 
    WHERE mailpack_id = mail_packages.id 
    AND image_sequence = 1
    LIMIT 1
  )
WHERE EXISTS (
  SELECT 1 
  FROM mail_scans 
  WHERE mailpack_id = mail_packages.id 
  AND image_sequence = 1
);

-- Verify the updates
SELECT 
  'Sample updated records' as status,
  mp.id,
  mp.industry,
  mp.brand_name,
  mp.company_validated,
  mp.response_intention,
  mp.name_check
FROM mail_packages mp
WHERE mp.industry IS NOT NULL OR mp.brand_name IS NOT NULL
ORDER BY mp.created_at DESC
LIMIT 5;
