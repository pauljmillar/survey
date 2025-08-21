-- Fix Automated Bonus Functions
-- This script fixes the column reference error in the handle_new_user_signup function

-- Drop and recreate the handle_new_user_signup function with correct column reference
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

  -- Find the onboarding survey (FIXED: use 'status' instead of 'is_active')
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

-- Add comment for documentation
COMMENT ON FUNCTION handle_new_user_signup IS 'Awards signup bonus and assigns onboarding survey for new panelist users (FIXED: uses correct status column)'; 