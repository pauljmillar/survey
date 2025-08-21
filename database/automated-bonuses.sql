-- Automated Bonus Processes
-- This file contains functions and triggers for automated point awards

-- Function to award signup bonus and assign onboarding survey
CREATE OR REPLACE FUNCTION handle_new_user_signup(p_user_id TEXT)
RETURNS VOID AS $$
DECLARE
  onboarding_survey_id UUID;
BEGIN
  -- Award signup bonus points
  PERFORM award_points(
    p_panelist_id := p_user_id,
    p_points := 100,
    p_transaction_type := 'account_signup_bonus',
    p_title := 'Welcome Bonus - Account Signup',
    p_description := '100 points awarded for creating a new account',
    p_metadata := '{"bonus_type": "signup", "amount": 100}',
    p_awarded_by := NULL -- System-awarded
  );

  -- Find the onboarding survey
  SELECT id INTO onboarding_survey_id
  FROM surveys
  WHERE title = 'Onboarding Background Questionnaire'
  AND status = 'active'
  LIMIT 1;

  -- If onboarding survey exists, assign it to the new user
  IF onboarding_survey_id IS NOT NULL THEN
    INSERT INTO survey_assignments (
      survey_id,
      panelist_id,
      assigned_at,
      status,
      priority
    ) VALUES (
      onboarding_survey_id,
      p_user_id,
      NOW(),
      'assigned',
      1 -- High priority for onboarding
    );
  END IF;

  RAISE NOTICE 'Signup bonus awarded and onboarding survey assigned for user %', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award app download bonus (first mobile app login)
CREATE OR REPLACE FUNCTION handle_first_app_login(p_panelist_id TEXT)
RETURNS VOID AS $$
DECLARE
  existing_sessions INTEGER;
BEGIN
  -- Check if this is the first scan session for this panelist
  SELECT COUNT(*) INTO existing_sessions
  FROM scan_sessions
  WHERE panelist_id = p_panelist_id::UUID;

  -- If this is the first session, award the bonus
  IF existing_sessions = 1 THEN
    PERFORM award_points(
      p_panelist_id := p_panelist_id,
      p_points := 100,
      p_transaction_type := 'app_download_bonus',
      p_title := 'Mobile App Download Bonus',
      p_description := '100 points awarded for first mobile app login',
      p_metadata := '{"bonus_type": "app_download", "amount": 100, "session_count": 1}',
      p_awarded_by := NULL -- System-awarded
    );

    RAISE NOTICE 'App download bonus awarded for panelist %', p_panelist_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new user creation
CREATE OR REPLACE FUNCTION trigger_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process panelist users
  IF NEW.role = 'panelist' THEN
    -- Call the signup handler function
    PERFORM handle_new_user_signup(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new scan session (mobile app login)
CREATE OR REPLACE FUNCTION trigger_new_scan_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the app login handler function
  PERFORM handle_first_app_login(NEW.panelist_id::TEXT);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_new_user_signup ON users;
CREATE TRIGGER trigger_new_user_signup
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_user_signup();

DROP TRIGGER IF EXISTS trigger_new_scan_session ON scan_sessions;
CREATE TRIGGER trigger_new_scan_session
  AFTER INSERT ON scan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_scan_session();

-- Add comments for documentation
COMMENT ON FUNCTION handle_new_user_signup IS 'Awards signup bonus and assigns onboarding survey for new panelist users';
COMMENT ON FUNCTION handle_first_app_login IS 'Awards app download bonus for first mobile app login';
COMMENT ON FUNCTION trigger_new_user_signup IS 'Trigger function for new user signup automation';
COMMENT ON FUNCTION trigger_new_scan_session IS 'Trigger function for mobile app login automation'; 