-- Rollback Mail Package Points System Changes
-- This script reverts the changes made in update-mail-package-points-system.sql
-- 
-- WARNING: This will remove the new triggers and restore the old mail_scan_points system
-- Make sure to backup your data before running this rollback

-- Step 1: Remove the new mail_packages triggers
DROP TRIGGER IF EXISTS trigger_mail_package_scan_points ON mail_packages;
DROP TRIGGER IF EXISTS trigger_mail_package_review_points ON mail_packages;
DROP FUNCTION IF EXISTS trigger_mail_package_scan_points();
DROP FUNCTION IF EXISTS trigger_mail_package_review_points();

-- Step 2: Restore the original mail_scan_points trigger
CREATE OR REPLACE FUNCTION trigger_mail_scan_points()
RETURNS TRIGGER AS $$
DECLARE
  user_id_text TEXT;
BEGIN
  -- Get the user_id (TEXT) for this panelist
  SELECT user_id INTO user_id_text
  FROM panelist_profiles
  WHERE id = NEW.panelist_id;
  
  -- Award 10 points for each mail scan
  PERFORM award_points(
    p_panelist_id := user_id_text,
    p_points := 10,
    p_transaction_type := 'mail_scan_points',
    p_title := 'Mail Scan Points',
    p_description := '10 points awarded for scanning mail advertisement',
    p_metadata := jsonb_build_object(
      'scan_id', NEW.id,
      'mailpack_id', NEW.mailpack_id,
      'image_sequence', NEW.image_sequence,
      's3_key', NEW.s3_key,
      'bonus_type', 'mail_scan',
      'amount', 10
    ),
    p_awarded_by := NULL -- System-awarded
  );

  RAISE NOTICE 'Mail scan points awarded: % points for panelist % (scan %)', 10, user_id_text, NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on mail_scans table
DROP TRIGGER IF EXISTS trigger_mail_scan_points ON mail_scans;
CREATE TRIGGER trigger_mail_scan_points
  AFTER INSERT ON mail_scans
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mail_scan_points();

-- Step 3: Revert transaction type changes
-- Update mail_package_scan records back to mail_scan_points
UPDATE point_ledger 
SET 
  transaction_type = 'mail_scan_points',
  title = 'Mail Scan Points',
  description = '10 points awarded for scanning mail advertisement'
WHERE transaction_type = 'mail_package_scan';

-- Step 4: Update the constraint to remove the new transaction types
-- First, delete any rows with the new transaction types
DELETE FROM point_ledger 
WHERE transaction_type IN ('mail_package_scan', 'mail_pack_review');

-- Drop the existing constraint
ALTER TABLE point_ledger DROP CONSTRAINT IF EXISTS point_ledger_valid_transaction_type;

-- Add the original constraint
ALTER TABLE point_ledger ADD CONSTRAINT point_ledger_valid_transaction_type 
  CHECK (transaction_type IN (
    'survey_completion', 
    'redemption', 
    'manual_adjustment', 
    'account_signup_bonus', 
    'app_download_bonus',
    'mail_scan_points'
  ));

-- Step 5: Verify the rollback
-- Show current transaction types in the constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'point_ledger_valid_transaction_type';

-- Show triggers on mail_scans table (should be restored)
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'mail_scans'
ORDER BY trigger_name;

-- Show triggers on mail_packages table (should be removed)
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'mail_packages'
ORDER BY trigger_name;
