-- Create function to award points for mail scans
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

-- Add the new transaction type to the constraint
-- First, delete any rows with invalid transaction types (for testing data)
DELETE FROM point_ledger 
WHERE transaction_type NOT IN (
  'survey_completion', 
  'redemption', 
  'manual_adjustment', 
  'account_signup_bonus', 
  'app_download_bonus',
  'mail_scan_points'
);

-- Now update the constraint
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  ALTER TABLE point_ledger DROP CONSTRAINT IF EXISTS point_ledger_valid_transaction_type;
  
  -- Add the new constraint with all valid transaction types
  ALTER TABLE point_ledger ADD CONSTRAINT point_ledger_valid_transaction_type 
    CHECK (transaction_type IN (
      'survey_completion', 
      'redemption', 
      'manual_adjustment', 
      'account_signup_bonus', 
      'app_download_bonus',
      'mail_scan_points'
    ));
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, do nothing
    NULL;
END $$;
