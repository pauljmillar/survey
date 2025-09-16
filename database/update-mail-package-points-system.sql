-- Update Mail Package Points System
-- This migration changes the points system from per-scan to per-package
-- 
-- Changes:
-- 1. Remove trigger that awards points on mail_scans insert
-- 2. Award 5 points on mail_packages insert
-- 3. Award 5 additional points when mail_packages.status = 'completed'
-- 4. Update transaction types and existing records

-- Step 1: Add missing columns to mail_packages table
ALTER TABLE mail_packages 
ADD COLUMN IF NOT EXISTS package_name TEXT,
ADD COLUMN IF NOT EXISTS package_description TEXT;

-- Step 2: Remove the existing mail scan points trigger
DROP TRIGGER IF EXISTS trigger_mail_scan_points ON mail_scans;
DROP FUNCTION IF EXISTS trigger_mail_scan_points();

-- Step 3: Update the point_ledger constraint to include new transaction types
-- First, delete any rows with invalid transaction types (for testing data)
DELETE FROM point_ledger 
WHERE transaction_type NOT IN (
  'survey_completion', 
  'redemption', 
  'manual_adjustment', 
  'account_signup_bonus', 
  'app_download_bonus',
  'mail_scan_points',
  'mail_package_scan',
  'mail_package_review'
);

-- Drop the existing constraint
ALTER TABLE point_ledger DROP CONSTRAINT IF EXISTS point_ledger_valid_transaction_type;

-- Add the updated constraint with new transaction types
ALTER TABLE point_ledger ADD CONSTRAINT point_ledger_valid_transaction_type 
  CHECK (transaction_type IN (
    'survey_completion', 
    'redemption', 
    'manual_adjustment', 
    'account_signup_bonus', 
    'app_download_bonus',
    'mail_scan_points',
    'mail_package_scan',
    'mail_package_review'
  ));

-- Step 4: Update existing mail_scan_points records to mail_package_scan
UPDATE point_ledger 
SET 
  transaction_type = 'mail_package_scan',
  title = 'Mail Package Scan',
  description = '5 points awarded for scanning a mail package'
WHERE transaction_type = 'mail_scan_points';

-- Step 5: Create function to award points on mail_packages insert
CREATE OR REPLACE FUNCTION trigger_mail_package_scan_points()
RETURNS TRIGGER AS $$
DECLARE
  user_id_text TEXT;
BEGIN
  -- Get the user_id (TEXT) for this panelist
  SELECT user_id INTO user_id_text
  FROM panelist_profiles
  WHERE id = NEW.panelist_id;
  
  -- Award 5 points for creating a mail package
  PERFORM award_points(
    p_panelist_id := user_id_text,
    p_points := 5,
    p_transaction_type := 'mail_package_scan',
    p_title := 'Mail Package Scan',
    p_description := '5 points awarded for scanning a mail package',
    p_metadata := jsonb_build_object(
      'package_id', NEW.id,
      'package_name', COALESCE(NEW.package_name, 'Unnamed Package'),
      'bonus_type', 'mail_package_scan',
      'amount', 5
    ),
    p_awarded_by := NULL -- System-awarded
  );

  RAISE NOTICE 'Mail package scan points awarded: % points for panelist % (package %)', 5, user_id_text, NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to award points when mail_packages status changes to 'completed'
CREATE OR REPLACE FUNCTION trigger_mail_package_review_points()
RETURNS TRIGGER AS $$
DECLARE
  user_id_text TEXT;
BEGIN
  -- Only award points if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get the user_id (TEXT) for this panelist
    SELECT user_id INTO user_id_text
    FROM panelist_profiles
    WHERE id = NEW.panelist_id;
    
    -- Award 5 points for completing mail package review
    PERFORM award_points(
      p_panelist_id := user_id_text,
      p_points := 5,
      p_transaction_type := 'mail_pack_review',
      p_title := 'Mail Package Review',
      p_description := '5 points awarded for reviewing the mail package',
      p_metadata := jsonb_build_object(
        'package_id', NEW.id,
        'package_name', COALESCE(NEW.package_name, 'Unnamed Package'),
        'reviewed_by', NEW.reviewed_by,
        'review_date', NEW.review_date,
        'bonus_type', 'mail_package_review',
        'amount', 5
      ),
      p_awarded_by := NEW.reviewed_by -- Awarded by the reviewer
    );

    RAISE NOTICE 'Mail package review points awarded: % points for panelist % (package %)', 5, user_id_text, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers
-- Trigger for mail_packages insert (award 5 points)
DROP TRIGGER IF EXISTS trigger_mail_package_scan_points ON mail_packages;
CREATE TRIGGER trigger_mail_package_scan_points
  AFTER INSERT ON mail_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mail_package_scan_points();

-- Trigger for mail_packages status update (award 5 points when status = 'completed')
DROP TRIGGER IF EXISTS trigger_mail_package_review_points ON mail_packages;
CREATE TRIGGER trigger_mail_package_review_points
  AFTER UPDATE ON mail_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mail_package_review_points();

-- Step 8: Add comments for documentation
COMMENT ON FUNCTION trigger_mail_package_scan_points IS 'Awards 5 points when a mail package is created';
COMMENT ON FUNCTION trigger_mail_package_review_points IS 'Awards 5 points when a mail package status is set to completed';

-- Step 9: Verify the changes
-- Show current transaction types in the constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'point_ledger_valid_transaction_type';

-- Show any existing records with the old transaction type (should be 0)
SELECT COUNT(*) as old_mail_scan_points_count
FROM point_ledger 
WHERE transaction_type = 'mail_scan_points';

-- Show updated records
SELECT COUNT(*) as mail_package_scan_count
FROM point_ledger 
WHERE transaction_type = 'mail_package_scan';

-- Show triggers on mail_packages table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'mail_packages'
ORDER BY trigger_name;
