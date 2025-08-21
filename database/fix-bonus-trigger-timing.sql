-- Fix Bonus Trigger Timing
-- Move signup bonus trigger from users table to panelist_profiles table

-- First, drop the existing trigger on users table
DROP TRIGGER IF EXISTS trigger_new_user_signup ON users;

-- Create new trigger function for panelist profile creation
CREATE OR REPLACE FUNCTION trigger_new_panelist_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Award signup bonus when panelist profile is created
  PERFORM award_points(
    p_panelist_id := NEW.user_id,
    p_points := 100,
    p_transaction_type := 'account_signup_bonus',
    p_title := 'Welcome Bonus - Account Signup',
    p_description := '100 points awarded for completing onboarding',
    p_metadata := '{"bonus_type": "signup", "amount": 100, "trigger": "panelist_profile_creation"}',
    p_awarded_by := NULL -- System-awarded
  );

  RAISE NOTICE 'Signup bonus awarded for panelist profile creation: user %', NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on panelist_profiles table
DROP TRIGGER IF EXISTS trigger_new_panelist_profile ON panelist_profiles;
CREATE TRIGGER trigger_new_panelist_profile
  AFTER INSERT ON panelist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_panelist_profile();

-- Keep the app download bonus trigger as is (on scan_sessions)
-- No changes needed for that one

-- Add comments for documentation
COMMENT ON FUNCTION trigger_new_panelist_profile IS 'Trigger function for panelist profile creation - awards signup bonus';
COMMENT ON FUNCTION trigger_new_scan_session IS 'Trigger function for mobile app login automation - awards app download bonus'; 