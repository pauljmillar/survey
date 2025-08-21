-- Cleanup Old Functions
-- Remove functions that are no longer needed after fixing trigger timing

-- Drop the old handle_new_user_signup function (no longer used)
DROP FUNCTION IF EXISTS handle_new_user_signup(TEXT);

-- Drop the old trigger function (no longer used)
DROP FUNCTION IF EXISTS trigger_new_user_signup();

-- Keep the handle_first_app_login function (still used for app download bonus)
-- Keep the trigger_new_scan_session function (still used for app download bonus)

-- Verify what functions remain
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%signup%' OR routine_name LIKE '%login%' OR routine_name LIKE '%profile%'
ORDER BY routine_name; 