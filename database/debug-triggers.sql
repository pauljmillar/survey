-- Debug script to check trigger status and test automated bonuses

-- Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_new_user_signup', 'trigger_new_scan_session')
ORDER BY trigger_name;

-- Check if functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user_signup', 'handle_first_app_login', 'trigger_new_user_signup', 'trigger_new_scan_session')
ORDER BY routine_name;

-- Check recent user signups (last 24 hours)
SELECT 
  id,
  email,
  role,
  created_at
FROM users 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check if any signup bonuses were awarded recently
SELECT 
  id,
  panelist_id,
  points,
  transaction_type,
  title,
  created_at
FROM point_ledger 
WHERE transaction_type = 'account_signup_bonus'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check if any app download bonuses were awarded recently
SELECT 
  id,
  panelist_id,
  points,
  transaction_type,
  title,
  created_at
FROM point_ledger 
WHERE transaction_type = 'app_download_bonus'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Test the signup function manually (replace 'your-user-id' with actual user ID)
-- SELECT handle_new_user_signup('your-user-id');

-- Check if onboarding survey exists
SELECT 
  id,
  title,
  is_active
FROM surveys 
WHERE title = 'Onboarding Background Questionnaire'; 